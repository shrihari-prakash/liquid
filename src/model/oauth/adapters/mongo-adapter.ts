import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-mongo-adapter" });

import { AuthorizationCode, RefreshToken, Token } from "@node-oauth/oauth2-server";
import TokenModel from "../../mongo/token.js";
import { isApplicationClient } from "../utils.js";
import { getUserInfo } from "../cache.js";
import { isTokenInvalidated } from "../../../utils/session.js";
import ClientModel, { ClientInterface } from "../../mongo/client.js";
import AuthorizationCodeModel from "../../mongo/authorization-code.js";
import { isRoleInvalidated } from "../../../utils/role.js";

class MongoAdapter {
  async saveToken(token: Token) {
    const dbToken = new TokenModel(token);
    await dbToken.save();
    return dbToken.toObject() as unknown as Token;
  }

  async checkToken(token: Token) {
    if (token && !isApplicationClient(token.user)) {
      token.user = await getUserInfo(token.user._id);
    }
    if (!token) {
      return null;
    }
    const user = token.user;
    const globalLogoutAt = user.globalLogoutAt;
    const tokenRegisteredAt = token.registeredAt;
    if (await isRoleInvalidated(user.role, tokenRegisteredAt as Date)) {
      log.debug("Expired token detected. Reason: Role invalidated.");
      return null;
    }
    if (isTokenInvalidated(globalLogoutAt, tokenRegisteredAt as Date)) {
      log.debug("Expired token detected. Reason: Token invalidated.");
      return null;
    }
    return token as unknown as Token;
  }

  async getAccessToken(accessToken: string) {
    const dbTokenObject = await TokenModel.findOne({
      accessToken,
    }).lean();
    return this.checkToken(dbTokenObject as unknown as Token);
  }

  async getRefreshToken(refreshToken: string) {
    const dbTokenObject = await TokenModel.findOne({
      refreshToken,
    }).lean();
    return this.checkToken(dbTokenObject as unknown as Token);
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
      let query: any = {};
      if (clientSecret) {
        query = {
          $and: [{ id: clientId }, { secret: clientSecret }],
        };
      } else {
        query = { id: clientId };
      }
      const dbClient = await ClientModel.findOne(query).lean();
      return dbClient as unknown as ClientInterface;
    } catch (err) {
      log.error("Error fetching client.");
      log.error(err);
      throw err;
    }
  }
}

export default new MongoAdapter() as MongoAdapter;

