import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/me.patch" });

import { Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel from "../../../model/mongo/user.js";
import { Configuration } from "../../../singleton/configuration.js";
import { bcryptConfig } from "./create.post.js";
import { hasErrors } from "../../../utils/api.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import UserValidator from "../../../validator/user.js";
import { flushUserInfoFromRedis } from "../../../model/oauth/cache.js";
import { checkPassword } from "./shared/auth.js";

const userValidator = new UserValidator(body);

export const PATCH_MeValidator = [
  userValidator.username(),
  userValidator.password(),
  userValidator.email(),
  userValidator.emailVerified(),
  userValidator.secondaryEmail(),
  userValidator.secondaryEmailVerified(),
  userValidator.firstName(),
  userValidator.middleName(),
  userValidator.lastName(),
  userValidator.phoneCountryCode(),
  userValidator.phone(),
  userValidator.phoneVerified(),
  userValidator.gender(),
  userValidator.preferredLanguage(),
  userValidator.bio(),
  userValidator.customLink(),
  userValidator.pronouns(),
  userValidator.organization(),

  userValidator.country(),
  body("currentPassword")
    .if((value, { req }) => {
      if (!Configuration.get("user.profile.update.require-current-password")) return false;
      const protectedFields = Configuration.get("user.profile.update.protected-fields");
      return protectedFields.some((field: string) => req.body[field] !== undefined);
    })
    .exists()
    .isString()
    .isLength({ min: 8, max: 128 }),
];

const PATCH_Me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const errors: any[] = [];
    Object.keys(req.body).forEach((key) => {
      if (!Configuration.get("user.profile.editable-fields").includes(key) && key !== "currentPassword") {
        errors.push({ msg: "Invalid value", param: key, location: "body" });
      }
      if (req.body[key] === "__unset__") {
        req.body[key] = null;
      }
    });

    if (Configuration.get("user.profile.update.require-current-password")) {
      const protectedFields = Configuration.get("user.profile.update.protected-fields");
      const hasProtectedFields = protectedFields.some((field: string) => req.body[field] !== undefined);
      if (hasProtectedFields) {
        const user = await UserModel.findById(userId).select("+password").exec();
        if (!user) {
          res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
          return;
        }
        if (!(await checkPassword(req.body.currentPassword, user.password || ""))) {
          res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
          return;
        }
      }
    }
    const password = req.body.password;
    if (password) {
      req.body.password = await bcrypt.hash(password, bcryptConfig.salt);
    }
    if (req.body.phone) {
      const errors = [];
      if (!Configuration.get("privilege.can-use-phone-number")) {
        errors.push({ msg: "Invalid value", param: "phone", location: "body" });
      }
      if (!req.body.phoneCountryCode) {
        errors.push({ msg: "Invalid value", param: "phoneCountryCode", location: "body" });
      }
      if (errors.length)
        res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
      return;
    }
    if (errors.length) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
      return;
    }
    const result = await UserModel.findByIdAndUpdate(userId, { $set: { ...req.body } }).exec();
    res.status(statusCodes.success).json(new SuccessResponse({ user: result }));
    flushUserInfoFromRedis(userId);
  } catch (err: any) {
    log.error(err);
    if (err?.name === "MongoServerError" && err?.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern);
      const key = keyPattern[0];
      res.status(statusCodes.conflict).json(new ErrorResponse(errorMessages.conflict, { duplicateFields: [key] }));
      return;
    }
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default PATCH_Me;

