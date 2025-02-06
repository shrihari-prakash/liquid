import { Request, Response, NextFunction } from "express";
import { Passport } from "../../../../singleton/passport.js";
import { query } from "express-validator";
import { GoogleLoginType } from "../../../../enum/google-login-type.js";
import { hasErrors } from "../../../../utils/api.js";

export const GET_GoogleSSOValidator = [query("type").exists().isIn(Object.values(GoogleLoginType))];

const GET_GoogleSSO = (req: Request, res: Response, next: NextFunction) => {
  if (hasErrors(req, res)) return;
  const state = {
    type: req.query.type,
  };
  return Passport.authenticate("google", {
    scope: ["profile", "email"],
    state: JSON.stringify(state),
  })(req, res, next);
};

export default GET_GoogleSSO;

