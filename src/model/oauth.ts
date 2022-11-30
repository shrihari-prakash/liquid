import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-model" });

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
      resolve({ username: "api-client" });
    });
  },

  saveToken: async (token: Token, client: Client, user: User) => {
    try {
      token.client = {
        id: client.id,
        grants: [],
      };
      token.user = user;
      const dbToken = new TokenModel(token);
      await dbToken.save();
      return dbToken.toObject() as unknown as Token;
    } catch (err) {
      log.error(err);
      throw err;
    }
  },

  getAccessToken: async (token: string) => {
    const dbTokenObject = await TokenModel.findOne({
      accessToken: token,
    }).lean();
    return dbTokenObject as unknown as Token;
  },

  getRefreshToken: async (token: string) => {
    const dbTokenObject = await TokenModel.findOne({
      refreshToken: token,
    }).lean();
    return dbTokenObject as unknown as Token;
  },

  revokeToken: (token: Token) => {
    if (!token) return false;
    return new Promise((resolve) => resolve(true));
  },

  saveAuthorizationCode: async (code: Code, client: Client, user: User) => {
    try {
      const authorizationCodeInstance = new AuthorizationCodeModel({
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        client: client || {},
        user: user || {},
      });
      const dbAuthorizationCode = (
        await authorizationCodeInstance.save()
      ).toObject();
      log.debug("AuthorizationCode saved.");
      return dbAuthorizationCode as unknown as AuthorizationCode;
    } catch (err) {
      log.error(err);
      throw err;
    }
  },

  getAuthorizationCode: async (authorizationCode: any) => {
    try {
      log.debug("Retrieving AuthorizationCode...");
      const dbAuthorizationCode = await AuthorizationCodeModel.findOne({
        authorizationCode,
      }).lean();
      log.debug("AuthorizationCode retrieved: %o", dbAuthorizationCode);
      return dbAuthorizationCode as unknown as AuthorizationCode;
    } catch (err) {
      log.debug("Error retrieving AuthorizationCode.");
      log.error(err);
      throw err;
    }
  },

  revokeAuthorizationCode: async (authorizationCode: any): Promise<boolean> => {
    try {
      await AuthorizationCodeModel.deleteOne({
        authorizationCode: authorizationCode.authorizationCode,
      }).exec();
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
