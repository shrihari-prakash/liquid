import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import OAuthModel from "../../../model/oauth";
import { ScopeManager } from "../../../singleton/scope-manager";

const ALL_Introspect = async (req: Request, res: Response) => {
  if (!ScopeManager.isScopeAllowedForSession("oauth.client.read", res)) {
    return;
  }
  const errors: any[] = [];
  console.log(req.body.token);
  console.log(req.query.token);
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
  delete tokenInfo.refreshToken;
  delete tokenInfo.refreshTokenExpiresAt;
  delete tokenInfo.client;
  res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo }));
};

export default ALL_Introspect;
