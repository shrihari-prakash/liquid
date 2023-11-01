import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-model" });

import { Redis } from "../singleton/redis";
import { Configuration } from "../singleton/configuration";

import AuthorizationCodeModel from "./mongo/authorization-code";
import ClientModel from "./mongo/client";
import TokenModel from "./mongo/token";
import UserModel, { UserInterface } from "./mongo/user";
import Role from "../enum/role";
import { ScopeManager } from "../singleton/scope-manager";
import {
  AuthorizationCode,
  AuthorizationCodeModel as OAuthAuthorizationCodeModel,
  ClientCredentialsModel,
  ExtensionModel,
  Falsey,
  PasswordModel,
  RefreshTokenModel,
  Token,
  RefreshToken,
} from "@node-oauth/oauth2-server";

interface Client {
  id: string;
  redirectUris?: string[];
  grants: string | string[];
  displayName: string;
  role: string;
  scope: string;
  accessTokenLifetime?: number | undefined;
  refreshTokenLifetime?: number | undefined;
  [key: string]: any;
}

interface User {
  [key: string]: any;
}

type OAuthModel =
  | OAuthAuthorizationCodeModel
  | ClientCredentialsModel
  | RefreshTokenModel
  | PasswordModel
  | ExtensionModel;

const useTokenCache = Configuration.get("privilege.can-use-cache");

const tokenPrefix = "token:";
const getPrefixedToken = (token: string) => `${tokenPrefix}${token}`;

const codePrefix = "code:";
const getPrefixedCode = (code: string) => `${codePrefix}${code}`;

const userIdPrefix = "user:";
const getPrefixedUserId = (userId: string) => `${userIdPrefix}${userId}`;

export const flushUserInfoFromRedis = async (userIds: string | string[]) => {
  if (typeof userIds === "string") {
    userIds = [userIds];
  }
  for (let i = 0; i < userIds.length; i++) {
    const key = getPrefixedUserId(userIds[i]);
    await Redis.client.del(key);
    log.debug("User info for %s flushed from cache.", key);
  }
};

const getUserInfo = async (userId: string) => {
  let userInfo;
  if (useTokenCache) {
    userInfo = await Redis.client.get(getPrefixedUserId(userId));
  }
  if (!userInfo) {
    userInfo = await UserModel.findById(userId).lean();
    if (useTokenCache) {
      await Redis.client.set(
        getPrefixedUserId(userId),
        JSON.stringify(userInfo),
        "EX",
        Configuration.get("oauth.refresh-token-lifetime") as number
      );
      log.debug("User info for %s written to cache.", userId);
    }
  } else {
    userInfo = JSON.parse(userInfo);
  }
  return userInfo;
};

const isApplicationClient = (user: any) => {
  const appplicationClient = user.role === Role.INTERNAL_CLIENT || user.role === Role.EXTERNAL_CLIENT;
  return appplicationClient;
};

const OAuthModel: OAuthModel = {
  getClient: async function (clientId: string, clientSecret: string) {
    try {
      let query: any = {};
      if (clientSecret) {
        query = {
          $and: [{ id: clientId }, { secret: clientSecret }],
        };
      } else {
        query = { id: clientId };
      }
      const dbClient = await ClientModel.findOne(query).lean();
      return dbClient as unknown as Client;
    } catch (err) {
      log.error("Error fetching client.");
      log.error(err);
      throw err;
    }
  },

  getUserFromClient: (client: Client) => {
    return new Promise<User>((resolve) => {
      // There is no notion of users in client_credentials grant.
      // So we simply return the client id for the username.
      // See more here: https://github.com/node-oauth/node-oauth2-server/issues/71#issuecomment-1181515928
      resolve({ _id: client._id, username: client.id, role: client.role, scope: client.scope });
    });
  },

  saveToken: async (token: Token, client: Client, user: User) => {
    try {
      token.client = client;
      if (!isApplicationClient(user)) {
        // No need to store the full user as _id is resolved to full object while retrieving from cache/db.
        token.user = { _id: user._id };
      } else {
        token.user = user;
      }
      if (useTokenCache) {
        const serialized = JSON.stringify(token);
        await Redis.client.set(
          getPrefixedToken(token.accessToken),
          serialized,
          "EX",
          Configuration.get("oauth.access-token-lifetime") as number
        );
        if (token.refreshToken)
          await Redis.client.set(
            getPrefixedToken(token.refreshToken),
            serialized,
            "EX",
            Configuration.get("oauth.refresh-token-lifetime") as number
          );
        return token;
      }
      const dbToken = new TokenModel(token);
      await dbToken.save();
      return dbToken.toObject() as unknown as Token;
    } catch (err) {
      log.error("Error saving token.");
      log.error(err);
      throw err;
    }
  },

  getAccessToken: async (accessToken: string) => {
    try {
      if (useTokenCache) {
        let cacheToken: any = await Redis.client.get(getPrefixedToken(accessToken));
        cacheToken = JSON.parse(cacheToken);
        if (!cacheToken) return null;
        if (!isApplicationClient(cacheToken.user)) {
          cacheToken.user = await getUserInfo(cacheToken.user._id);
        }
        cacheToken.accessTokenExpiresAt = new Date(cacheToken.accessTokenExpiresAt);
        return cacheToken;
      }
      const dbTokenObject = await TokenModel.findOne({
        accessToken,
      }).lean();
      if (dbTokenObject && !isApplicationClient(dbTokenObject.user)) {
        dbTokenObject.user = await getUserInfo(dbTokenObject.user._id);
      }
      return dbTokenObject as unknown as Token;
    } catch (err) {
      log.error("Error retrieving access token.");
      log.error(err);
      throw err;
    }
  },

  getRefreshToken: async (refreshToken: string) => {
    if (useTokenCache) {
      let cacheToken: any = await Redis.client.get(getPrefixedToken(refreshToken));
      cacheToken = JSON.parse(cacheToken);
      if (!cacheToken) return null;
      if (!isApplicationClient(cacheToken.user)) {
        cacheToken.user = await getUserInfo(cacheToken.user._id);
      }
      cacheToken.refreshTokenExpiresAt = new Date(cacheToken.refreshTokenExpiresAt);
      log.debug("Refresh token retrieved from cache.");
      return cacheToken;
    }
    const dbTokenObject = await TokenModel.findOne({
      refreshToken,
    }).lean();
    if (dbTokenObject && !isApplicationClient(dbTokenObject.user)) {
      dbTokenObject.user = await getUserInfo(dbTokenObject.user._id);
    }
    log.debug("Refresh token retrieved from database.");
    return dbTokenObject as unknown as Token;
  },

  revokeToken: async (token: RefreshToken) => {
    if (!token) return false;
    if (useTokenCache) {
      if (token.refreshToken) {
        await Redis.client.del(getPrefixedToken(token.refreshToken));
      }
      if (token.accessToken) {
        await Redis.client.del(getPrefixedToken(token.accessToken));
      }
      return true;
    }
    if (token.refreshToken) {
      await TokenModel.deleteOne({
        refreshToken: token.refreshToken,
      }).exec();
    }
    return true;
  },

  saveAuthorizationCode: async (code: AuthorizationCode, client: Client, user: User) => {
    try {
      const authorizationCode = {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        client: client || {},
        user: user || {},
        codeChallenge: code.codeChallenge,
        codeChallengeMethod: code.codeChallengeMethod,
        scope: code.scope,
      };
      if (useTokenCache) {
        await Redis.client.set(
          getPrefixedCode(authorizationCode.authorizationCode),
          JSON.stringify(authorizationCode),
          "EX",
          Configuration.get("oauth.authorization-code-lifetime") as number
        );
        return authorizationCode;
      }
      const mongoInstance = new AuthorizationCodeModel(authorizationCode);
      const dbAuthorizationCode = (await mongoInstance.save()).toObject();
      return dbAuthorizationCode as unknown as AuthorizationCode;
    } catch (err) {
      log.error("Error saving authorization code.");
      log.error(err);
      throw err;
    }
  },

  getAuthorizationCode: async (authorizationCode: any) => {
    try {
      if (useTokenCache) {
        let cacheCode: any = (await Redis.client.get(getPrefixedCode(authorizationCode))) as string;
        if (!cacheCode) return null;
        cacheCode = JSON.parse(cacheCode) as AuthorizationCode;
        cacheCode.expiresAt = new Date(cacheCode.expiresAt);
        return cacheCode;
      }
      const dbResult = await AuthorizationCodeModel.findOne({
        authorizationCode,
      }).lean();
      return dbResult as unknown as AuthorizationCode;
    } catch (err) {
      log.error("Error retrieving auth code.");
      log.error(err);
      throw err;
    }
  },

  revokeAuthorizationCode: async (authorizationCode: any): Promise<boolean> => {
    try {
      const code = authorizationCode.authorizationCode;
      if (useTokenCache) {
        await Redis.client.del(getPrefixedCode(code));
        return true;
      }
      await AuthorizationCodeModel.deleteOne({
        authorizationCode: code,
      }).exec();
      return true;
    } catch (err) {
      log.error("Error deleting authorization code.");
      log.error(err);
      throw err;
    }
  },

  validateScope: (user: UserInterface, client: Client, scope: string[]): Promise<string[] | Falsey> => {
    log.debug("Validating scope %s for client %s and user %s.", scope, client.id, user.username);
    return new Promise((resolve) => {
      const clientHasAccess = ScopeManager.canRequestScope(scope, client);
      if (!clientHasAccess) {
        log.debug(
          "Scope validation for client %s failed due to insufficient access. Requested scope: %s",
          client.id,
          scope
        );
        return resolve(false);
      }
      if (client.id === user.username) {
        // For client credentials grant, there is no notion of user.
        return resolve(scope);
      }
      if (!user.scope) {
        user.scope = Configuration.get("user.account-creation.default-scope");
      }
      // Sometimes, the frontends do not know the scopes a user can request ahead of time.
      // Since there is usually a higher amount of trust for internal clients in the system,
      // it is okay to return all scopes that a user has access to.
      if (client.role === Role.INTERNAL_CLIENT) {
        scope = user.scope;
        log.debug(
          "Granting all allowed scopes (%s) for user %s due to request from internal client",
          scope,
          user.username
        );
        return resolve(scope);
      }
      const userHasAccess = ScopeManager.canRequestScope(scope, user);
      if (userHasAccess) {
        resolve(scope);
      } else {
        resolve(false);
      }
    });
  },

  verifyScope: (token: Token, requestedScopes: string[]): Promise<boolean> => {
    log.info("Verifying scope for token %s...", token.accessToken);
    return new Promise((resolve) => {
      const authorizedScopes = token.scope;
      if (!authorizedScopes) {
        return false;
      }
      return resolve(requestedScopes.every((s: string) => authorizedScopes.indexOf(s) >= 0));
    });
  },
};

export default OAuthModel;
