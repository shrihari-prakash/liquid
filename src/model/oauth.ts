import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-model" });

import { Redis } from "../singleton/redis";
import { Configuration } from "../singleton/configuration";

import AuthorizationCodeModel from "./mongo/authorization-code";
import ClientModel from "./mongo/client";
import TokenModel from "./mongo/token";

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
}

interface Client {
  id: string;
  redirectUris?: Scope;
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

const useTokenCache = Configuration.get("privilege.can-use-cache-for-token");

const OAuthModel = {
  getClient: async function (clientId: string, clientSecret: string) {
    try {
      const query: any = {
        id: clientId,
      };
      if (clientSecret) {
        query.secret = clientSecret;
      }
      const dbClient = await ClientModel.findOne(query).lean();
      return dbClient as unknown as Client;
    } catch (err) {
      log.error(err);
      throw err;
    }
  },

  getUserFromClient: (client: Client) => {
    return new Promise<User>((resolve) => {
      resolve({ username: "api-client", role: client.role });
    });
  },

  saveToken: async (token: Token, client: Client, user: User) => {
    try {
      token.client = client;
      token.user = user;
      if (useTokenCache) {
        const serialized = JSON.stringify(token);
        await Redis.client.set(
          token.accessToken,
          serialized,
          "EX",
          Configuration.get("access-token-lifetime") as number
        );
        if (token.refreshToken)
          await Redis.client.set(
            token.refreshToken,
            serialized,
            "EX",
            Configuration.get("refresh-token-lifetime") as number
          );
        log.debug("Token saved to cache.");
        return token;
      }
      const dbToken = new TokenModel(token);
      await dbToken.save();
      log.debug("Token saved to cache.");
      return dbToken.toObject() as unknown as Token;
    } catch (err) {
      log.error(err);
      throw err;
    }
  },

  getAccessToken: async (accessToken: string) => {
    try {
      if (useTokenCache) {
        log.debug("Get access token.");
        let cacheToken: any = await Redis.client.get(accessToken);
        cacheToken = JSON.parse(cacheToken);
        if (!cacheToken) return null;
        cacheToken.accessTokenExpiresAt = new Date(
          cacheToken.accessTokenExpiresAt
        );
        log.debug("Access token retrieved from cache.");
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
      let cacheToken: any = await Redis.client.get(refreshToken);
      cacheToken = JSON.parse(cacheToken);
      if (!cacheToken) return null;
      cacheToken.refreshTokenExpiresAt = new Date(
        cacheToken.refreshTokenExpiresAt
      );
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
        await Redis.client.del(token.refreshToken);
      }
      if (token.accessToken) {
        await Redis.client.del(token.accessToken);
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
      };
      if (useTokenCache) {
        await Redis.client.set(
          authorizationCode.authorizationCode,
          JSON.stringify(authorizationCode),
          "EX",
          Configuration.get("authorization-code-lifetime") as number
        );
        return authorizationCode;
      }
      const mongoInstance = new AuthorizationCodeModel(authorizationCode);
      const dbAuthorizationCode = (await mongoInstance.save()).toObject();
      log.debug("AuthorizationCode saved.");
      return dbAuthorizationCode as unknown as AuthorizationCode;
    } catch (err) {
      log.error(err);
      throw err;
    }
  },

  getAuthorizationCode: async (authorizationCode: any) => {
    try {
      if (useTokenCache) {
        let cacheCode: any = (await Redis.client.get(
          authorizationCode
        )) as string;
        log.debug("Auth code retrieved from cache.");
        cacheCode = JSON.parse(cacheCode) as AuthorizationCode;
        cacheCode.expiresAt = new Date(cacheCode.expiresAt);
        return cacheCode;
      }
      const dbResult = await AuthorizationCodeModel.findOne({
        authorizationCode,
      }).lean();
      log.debug("Auth code retrieved from database.");
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
        await Redis.client.del(code);
        log.debug("Auth code deleted from cache.");
        return true;
      }
      await AuthorizationCodeModel.deleteOne({
        authorizationCode: code,
      }).exec();
      log.debug("Auth code deleted from database.");
      return true;
    } catch (err) {
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
