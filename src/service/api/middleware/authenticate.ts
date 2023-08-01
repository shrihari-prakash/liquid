import { NextFunction, Request, Response } from "express";
import { Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";

import Role from "../../../enum/role";
import { OAuthServer } from "../../../singleton/oauth-server";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse } from "../../../utils/response";

const AuthenticateUser = async (_: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.user = res.locals.oauth.token.user;
    if (res.locals.user.isBanned === true) {
      res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.banned));
      return next(new Error(errorMessages.banned));
    }
    return next();
  } catch (err) {
    res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    return;
  }
};

const AuthenticateClient = async (_: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.user = res.locals.oauth.token.user;
    if (res.locals.user.role !== Role.INTERNAL_CLIENT && res.locals.user.role !== Role.EXTERNAL_CLIENT) {
      throw statusCodes.unauthorized;
    }
    res.locals.user.isClient = true;
    res.locals.client = res.locals.oauth.token.client;
    return next();
  } catch (err) {
    res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    return;
  }
};

const Authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = await OAuthServer.server.authenticate(new OAuthRequest(req), new OAuthResponse(res));
    res.locals.oauth = { token: token };
    next();
  } catch (err) {
    res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    return;
  }
};

export const DelegatedAuthFlow = [Authenticate, AuthenticateUser];
export const ClientAuthFlow = [Authenticate, AuthenticateClient];
