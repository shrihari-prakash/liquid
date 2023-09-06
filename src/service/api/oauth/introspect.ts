import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import OAuthModel from "../../../model/oauth";
import Role from "../../../enum/role";
import { ScopeManager } from "../../../singleton/scope-manager";
import { UserProjection } from "../../../model/mongo/user";
import { Configuration } from "../../../singleton/configuration";

const ALL_Introspect = async (req: Request, res: Response) => {
  if (!ScopeManager.isScopeAllowedForSession("client:oauth:read", res)) {
    return;
  }
  const role = res.locals.user.role;
  if (role === Role.EXTERNAL_CLIENT && !Configuration.get("oauth.external-client.allow-introspection")) {
    return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
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
    return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden, { errors }));
  }
  const token = req.query.token || req.body.token;
  const tokenInfo = await OAuthModel.getAccessToken(token);
  if (!tokenInfo || tokenInfo.accessToken !== token) {
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
    if (!UserProjection[field]) {
      tokenInfo.user[field] = undefined;
    }
  }
  res.status(statusCodes.success).json(new SuccessResponse({ tokenInfo }));
};

export default ALL_Introspect;
