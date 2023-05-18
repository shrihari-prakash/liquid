import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/me" });

import { Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";
import { Configuration } from "../../../singleton/configuration";
import { bcryptConfig } from "./create.post";
import { hasErrors } from "../../../utils/api";
import { Language } from "../../../enum/language";
import { flushUserInfoFromRedis } from "../../../model/oauth";

const languages = Language.map((l) => l.code);

export const PATCH_MeValidator = [
  body("username")
    .optional()
    .isString()
    .isLength({ min: 8, max: 30 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").optional().isEmail(),
  body("password").optional().isString().isLength({ min: 8, max: 128 }),
  body("firstName").optional().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("lastName").optional().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("gender").optional().isString().isLength({ min: 2, max: 128 }),
  body("preferredLanguage").optional().isString().isAlpha().isIn(languages).isLength({ min: 2, max: 2 }),
  body("bio").optional().isString().isLength({ min: 3, max: 256 }),
  body("customLink").optional().isURL().isLength({ min: 3, max: 256 }),
  body("pronouns").optional().isString().isLength({ min: 3, max: 24 }),
  body("organization").optional().isString().isLength({ min: 3, max: 128 }),
  body("phoneCountryCode")
    .optional()
    .isString()
    .isLength({ min: 2, max: 6 })
    .matches(/^(\+?\d{1,3}|\d{1,4})$/gm),
  body("phone").optional().isString().isLength({ min: 10, max: 12 }),
];

const PATCH_Me = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const errors: any[] = [];
    Object.keys(req.body).forEach((key) => {
      if (!Configuration.get("user.profile.editable-fields").includes(key)) {
        errors.push({
          msg: "Invalid value",
          param: key,
          location: "body",
        });
      }
    });
    const password = req.body.password;
    if (password) {
      req.body.password = await bcrypt.hash(password, bcryptConfig.salt);
    }
    if (req.body.phone) {
      const errors = [];
      if (!Configuration.get("privilege.can-use-phone-number")) {
        errors.push({
          msg: "Invalid value",
          param: "phone",
          location: "body",
        });
      }
      if (!req.body.phoneCountryCode) {
        errors.push({
          msg: "Invalid value",
          param: "phoneCountryCode",
          location: "body",
        });
      }
      if (errors.length)
        return res
          .status(statusCodes.clientInputError)
          .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    if (errors.length) {
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    await UserModel.updateOne({ _id: userId }, { $set: { ...req.body } }).exec();
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(userId);
  } catch (err: any) {
    log.error(err);
    if (err?.name === "MongoServerError" && err?.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern);
      const key = keyPattern[0];
      return res
        .status(statusCodes.conflict)
        .json(new ErrorResponse(errorMessages.conflict, { duplicateFields: [key] }));
    }
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default PATCH_Me;
