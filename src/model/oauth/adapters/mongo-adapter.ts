import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-mongo-adapter" });

import { AuthorizationCode, RefreshToken, Token } from "@node-oauth/oauth2-server";
import TokenModel from "../../mongo/token.js";
import { isApplicationClient, validateAccessTokenScopes, recalculateRefreshTokenScopes } from "../utils.js";
import { getUserInfo } from "../cache.js";
import { isTokenInvalidated } from "../../../utils/session.js";
import ClientModel, { ClientInterface } from "../../mongo/client.js";
import AuthorizationCodeModel from "../../mongo/authorization-code.js";

class MongoAdapter {
  async saveToken(token: Token) {
    token.registeredAt = token.registeredAt || new Date();
    const dbToken = new TokenModel(token);
    await dbToken.save();
    return dbToken.toObject() as unknown as Token;
  }

  async checkToken(token: Token, isRefreshToken = false) {
    if (token && !isApplicationClient(token.user)) {
      token.user = await getUserInfo(token.user._id);
    }
    if (!token || !token.user) {
      return null;
    }
    const user = token.user;
    const globalLogoutAt = user.globalLogoutAt;
    const tokenRegisteredAt = token.registeredAt;
    if (isTokenInvalidated(globalLogoutAt, tokenRegisteredAt as Date)) {
      log.debug("Expired token detected. Reason: Token invalidated.");
      return null;
    }
    if (!isRefreshToken) {
      const isValid = await validateAccessTokenScopes(token, user, tokenRegisteredAt as Date);
      if (!isValid) return null;
    } else {
      token.scope = recalculateRefreshTokenScopes(token, user, token.client);
    }
    return token as unknown as Token;
  }

  async getAccessToken(accessToken: string) {
    const dbTokenObject = await TokenModel.findOne({
      accessToken,
    }).lean();
    return this.checkToken(dbTokenObject as unknown as Token, false);
  }

  async getRefreshToken(refreshToken: string) {
    const dbTokenObject = await TokenModel.findOne({
      refreshToken,
    }).lean();
    return this.checkToken(dbTokenObject as unknown as Token, true);
  }

  async revokeToken(token: RefreshToken) {
    if (token.refreshToken) {
      await TokenModel.deleteOne({
        refreshToken: token.refreshToken,
      }).exec();
    }
    return true;
  }

  async saveAuthorizationCode(authorizationCode: AuthorizationCode) {
    const mongoInstance = new AuthorizationCodeModel(authorizationCode);
    const dbAuthorizationCode = (await mongoInstance.save()).toObject();
    return dbAuthorizationCode as unknown as AuthorizationCode;
  }

  async getAuthorizationCode(authorizationCode: string) {
    const dbResult = await AuthorizationCodeModel.findOne({
      authorizationCode,
    }).lean();
    return dbResult as unknown as AuthorizationCode;
  }

  async revokeAuthorizationCode(authorizationCode: AuthorizationCode) {
    await AuthorizationCodeModel.deleteOne({
      authorizationCode,
    }).exec();
    return true;
  }

  async getClient(clientId: string, clientSecret: string) {
    try {
      const dbClient = (await ClientModel.findOne({ id: clientId }).lean()) as unknown as ClientInterface;
      if (!dbClient) {
        return null;
      }
      if (dbClient.isPublic) {
        return dbClient;
      }
      if (!clientSecret || dbClient.secret !== clientSecret) {
        return null;
      }
      return dbClient;
    } catch (err) {
      log.error("Error fetching client.");
      log.error(err);
      throw err;
    }
  }
}

export default new MongoAdapter() as MongoAdapter;

