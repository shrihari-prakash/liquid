import { NextFunction, Request, Response } from "express";
import { OAuthServer } from "../../../singleton/oauth-server";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse } from "../../../utils/response";

const AuthenticateApp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.locals.user = res.locals.oauth.token.user;
    if (res.locals.user.isBanned === true) {
      res
        .status(statusCodes.forbidden)
        .json(new ErrorResponse(errorMessages.banned));
      return next(new Error(errorMessages.banned));
    }
    return next();
  } catch (err) {
    res
      .status(statusCodes.unauthorized)
      .json(new ErrorResponse(errorMessages.unauthorized));
    return next(new Error(errorMessages.unauthorized));
  }
};

const AuthFlow = [OAuthServer.server.authenticate(), AuthenticateApp];

export default AuthFlow;
