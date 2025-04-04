import { Request, Response } from "express";

import { statusCodes } from "../../../utils/http-status.js";
import { SuccessResponse } from "../../../utils/response.js";
import OAuthModel from "../../../model/oauth/oauth.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { UserProjection } from "../../../model/mongo/user.js";

const ALL_Introspect = async (req: Request, res: Response): Promise<void> => {
  if (!ScopeManager.isScopeAllowedForSession("client:oauth:introspect", res)) {
    return;
  }
  const errors: any[] = [];
  if (
    (!req.body.token && typeof req.query.token !== "string") ||
    (!req.query.token && typeof req.body.token !== "string") ||
    (!req.query.token && !req.body.token)
  ) {
    errors.push({
      msg: "Invalid value",
      param: "token",
    });
  }
  if (errors.length) {
    res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo: null }));
    return;
  }
  const token = req.query.token || req.body.token;
  const tokenInfo = await OAuthModel.getAccessToken(token);
  if (!tokenInfo || tokenInfo.accessToken !== token) {
    res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo: null }));
    return;
  }
  tokenInfo.authorizationCode = undefined;
  tokenInfo.refreshToken = undefined;
  tokenInfo.refreshTokenExpiresAt = undefined;
  tokenInfo.client.secret = undefined;
  const allFields = Object.keys(tokenInfo.user);
  for (let i = 0; i < allFields.length; i++) {
    const field = allFields[i] as string;
    // @ts-ignore
    if (!UserProjection[field]) {
      tokenInfo.user[field] = undefined;
    }
  }
  res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo }));
};

export default ALL_Introspect;
