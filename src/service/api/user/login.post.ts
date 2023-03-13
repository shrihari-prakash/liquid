import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/login" });

import bcrypt from "bcrypt";
import { Request, Response } from "express";
const { body } = require("express-validator");

import UserModel from "../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { hasErrors } from "../../../utils/api";

export const POST_LoginValidator = [
  body("username")
    .optional()
    .isString()
    .isLength({ min: 8, max: 16 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").optional().isString().isEmail(),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
];

const POST_Login = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const { username, email, password } = req.body;
    const select = ["+password"];
    const query: any = {};
    if (email) {
      query.email = email.toLowerCase();
    } else {
      query.username = username;
    }
    const user = await UserModel.findOne(query, select).exec();
    if (!user) return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    if (!user.emailVerified)
      return res.status(statusCodes.resourceNotActive).json(new ErrorResponse(errorMessages.resourceNotActive));
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid)
      return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    user.password = undefined;
    const response = {
      userInfo: user,
    };
    req.session.user = user;
    return res.status(statusCodes.success).json(new SuccessResponse(response));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Login;
