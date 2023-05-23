import { NextFunction, Request, Response } from "express";
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
    return next(new Error(errorMessages.unauthorized));
  }
};

const AuthenticateClient = async (_: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.user = res.locals.oauth.token.user;
    if (res.locals.user.role !== Role.INTERNAL_CLIENT) {
      throw statusCodes.unauthorized;
    }
    res.locals.client = res.locals.oauth.token.client;
    return next();
  } catch (err) {
    res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    return next(new Error(errorMessages.unauthorized));
  }
};

export const DelegatedAuthFlow = [OAuthServer.server.authenticate, AuthenticateUser];
export const ClientAuthFlow = [OAuthServer.server.authenticate, AuthenticateClient];
