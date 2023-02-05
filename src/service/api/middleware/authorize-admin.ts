import { NextFunction, Request, Response } from "express";
import Role from "../../../enum/role";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse } from "../../../utils/response";

const AuthorizeAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.locals.user = res.locals.oauth.token.user;
    const apiPath = req.baseUrl + req.path;
    if (
      res.locals.user.role !== Role.SUPER_ADMIN &&
      !res.locals.user.allowedAdminAPIs.includes(`${req.method}_${apiPath}`)
    ) {
      res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
      return next(new Error(errorMessages.forbidden));
    }
    return next();
  } catch (err) {
    res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    return next(new Error(errorMessages.unauthorized));
  }
};

export default AuthorizeAdmin;
