import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-model" });

import { Redis } from "../singleton/redis";
import { Configuration } from "../singleton/configuration";

import AuthorizationCodeModel from "./mongo/authorization-code";
import ClientModel from "./mongo/client";
import TokenModel from "./mongo/token";
import UserModel from "./mongo/user";
import Role from "../enum/role";

interface Token {
  accessToken: string;
  accessTokenExpiresAt?: Date | undefined;
  refreshToken?: string | undefined;
  refreshTokenExpiresAt?: Date | undefined;
  scope?: Scope;
  client: Client;
  user: User;
  [key: string]: any;
}

interface Code {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
}

interface Client {
  id: string;
  redirectUris?: string[];
  grants: string | string[];
  displayName: string;
  role: string;
  accessTokenLifetime?: number | undefined;
  refreshTokenLifetime?: number | undefined;
  [key: string]: any;
}

interface User {
  [key: string]: any;
}

interface AuthorizationCode {
  authorizationCode: string;
  expiresAt: Date;
  redirectUri: string;
  scope?: Scope;
  client: Client;
  user: User;
  [key: string]: any;
}

type Scope = string | string[] | undefined;

const useTokenCache = Configuration.get("privilege.can-use-cache");

const tokenPrefix = "token:";
const getPrefixedToken = (token: string) => `${tokenPrefix}${token}`;

const codePrefix = "code:";
const getPrefixedCode = (code: string) => `${codePrefix}${code}`;

const userIdPrefix = "user:";
const getPrefixedUserId = (userId: string) => `${userIdPrefix}${userId}`;

export const flushUserInfoFromRedis = async (userId: string) => {
  await Redis.client.del(getPrefixedUserId(userId));
  log.debug("User info for %s flushed from cache.", userId);
};

const getUserInfo = async (userId: string) => {
  let userInfo = await Redis.client.get(getPrefixedUserId(userId));
  if (!userInfo) {
    userInfo = await UserModel.findById(userId).lean();
    await Redis.client.set(
      getPrefixedUserId(userId),
      JSON.stringify(userInfo),
      "EX",
      Configuration.get("oauth.refresh-token-lifetime") as number
    );
    log.debug("User info for %s written to cache.", userId);
  } else {
    userInfo = JSON.parse(userInfo);
  }
  return userInfo;
};

const OAuthModel = {
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
      resolve({ _id: client._id, username: client.id, role: client.role });
    });
  },

  saveToken: async (token: Token, client: Client, user: User) => {
    try {
      token.client = client;
      if (user.role !== Role.INTERNAL_CLIENT) {
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
        if (cacheToken.user.role !== Role.INTERNAL_CLIENT) {
          cacheToken.user = await getUserInfo(cacheToken.user._id);
        }
        cacheToken.accessTokenExpiresAt = new Date(cacheToken.accessTokenExpiresAt);
        return cacheToken;
      }
      const dbTokenObject = await TokenModel.findOne({
        accessToken,
      }).lean();
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
      if (cacheToken.user.role !== Role.INTERNAL_CLIENT) {
        cacheToken.user = await getUserInfo(cacheToken.user._id);
      }
      cacheToken.refreshTokenExpiresAt = new Date(cacheToken.refreshTokenExpiresAt);
      log.debug("Refresh token retrieved from cache.");
      return cacheToken;
    }
    const dbTokenObject = await TokenModel.findOne({
      refreshToken,
    }).lean();
    log.debug("Refresh token retrieved from database.");
    return dbTokenObject as unknown as Token;
  },

  revokeToken: async (token: Token) => {
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

  saveAuthorizationCode: async (code: Code, client: Client, user: User) => {
    try {
      const authorizationCode = {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        client: client || {},
        user: user || {},
        codeChallenge: code.codeChallenge,
        codeChallengeMethod: code.codeChallengeMethod,
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

  verifyScope: (token: Token, scope: string | string[]): Promise<boolean> => {
    /* This is where we check to make sure the client has access to this scope */
    const userHasAccess = scope === "default"; // return true if this user / client combo has access to this resource
    return new Promise((resolve) => resolve(userHasAccess));
  },
};

export default OAuthModel;
