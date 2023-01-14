import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/me" });

import { Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";
import Role from "../../../../enum/role";
import { bcryptConfig } from "../create.post";
import { validateErrors } from "../../../../utils/api";

export const PATCH_UserValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 64 }),
  body("username")
    .optional()
    .isString()
    .isLength({ min: 8, max: 16 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").optional().isEmail(),
  body("password").optional().isString().isLength({ min: 8, max: 128 }),
  body("firstName")
    .optional()
    .isString()
    .isAlpha()
    .isLength({ min: 3, max: 32 }),
  body("lastName")
    .optional()
    .isString()
    .isAlpha()
    .isLength({ min: 3, max: 32 }),
];

const PATCH_User = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const userId = req.body.target;
    delete req.body.target;
    const errors: any[] = [];
    Object.keys(req.body).forEach((key) => {
      if (
        !Configuration.get("admin-api.profile.editable-fields").includes(key) ||
        typeof req.body[key] !== "string"
      ) {
        errors.push({
          msg: "Invalid value",
          param: key,
          location: "body",
        });
      }
    });
    if (
      req.body.role &&
      res.locals.user.role !== Role.SUPER_ADMIN &&
      res.locals.user.role !== Role.ADMIN
    ) {
      return res
        .status(statusCodes.forbidden)
        .json(new ErrorResponse(errorMessages.forbidden));
    }
    const password = req.body.password;
    if (password) {
      req.body.password = await bcrypt.hash(password, bcryptConfig.salt);
    }
    if (errors.length) {
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    await UserModel.updateOne(
      { _id: userId },
      { $set: { ...req.body } }
    ).exec();
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default PATCH_User;
