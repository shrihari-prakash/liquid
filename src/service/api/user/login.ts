import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
const { body, validationResult } = require("express-validator");

import UserModel from "../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";

export const LoginValidator = [
  body("username")
    .optional()
    .isString()
    .isLength({ min: 8, max: 16 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").optional().isString().isEmail(),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
];

const Login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          errors: errors.array(),
        })
      );
    }

    const { username, email, password } = req.body;
    if ((!email && !username) || !password)
      return res
        .status(statusCodes.unauthorized)
        .json(new ErrorResponse(errorMessages.unauthorized));

    const select = ["+password"];
    const query: any = {};
    if (email) {
      query.email = email.toLowerCase();
    } else {
      query.username = username;
    }
    const user = await UserModel.findOne(query, select).exec();
    if (!user)
      return res
        .status(statusCodes.unauthorized)
        .json(new ErrorResponse(errorMessages.unauthorized));

    if (!user.emailVerified)
      return res
        .status(statusCodes.resourceNotActive)
        .json(new ErrorResponse(errorMessages.resourceNotActive));

    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid)
      return res
        .status(statusCodes.unauthorized)
        .json(new ErrorResponse(errorMessages.unauthorized));

    user.password = undefined;
    const response = {
      userInfo: user,
    };
    req.session.user = user;
    return res.status(statusCodes.success).json(new SuccessResponse(response));
  } catch (err) {
    console.log(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Login;
