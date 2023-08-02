import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import OAuthModel from "../../../model/oauth";
import { ScopeManager } from "../../../singleton/scope-manager";
import { IUserProjection } from "../../../model/mongo/user";

const ALL_Introspect = async (req: Request, res: Response) => {
  if (!ScopeManager.isScopeAllowedForSession("oauth.client.read", res)) {
    return;
  }
  const errors: any[] = [];
  Object.keys(req.body).forEach((key) => {
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
  });
  if (errors.length) {
    return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden, { errors }));
  }
  const tokenInfo = await OAuthModel.getAccessToken(req.query.token || req.body.token);
  if (!tokenInfo) {
    return res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo: null }));
  }
  tokenInfo.authorizationCode = undefined;
  tokenInfo.refreshToken = undefined;
  tokenInfo.refreshTokenExpiresAt = undefined;
  tokenInfo.client = undefined;
  const allFields = Object.keys(tokenInfo.user);
  for (let i = 0; i < allFields.length; i++) {
    const field = allFields[i] as string;
    // @ts-ignore
    if (!IUserProjection[field]) {
      tokenInfo.user[field] = undefined;
    }
  }
  res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo }));
};

export default ALL_Introspect;
