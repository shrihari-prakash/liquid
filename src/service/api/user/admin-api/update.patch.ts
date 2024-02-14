import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/update.patch" });

import { Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { UserInterface, userSchema } from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";
import Role from "../../../../enum/role";
import { bcryptConfig } from "../create.post";
import { hasErrors } from "../../../../utils/api";
import { PATCH_MeValidator } from "../me.patch";
import { flushUserInfoFromRedis } from "../../../../model/oauth/oauth";
import { isRoleRankHigher } from "../../../../utils/role";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const PATCH_UpdateValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  ...PATCH_MeValidator,
];

const PATCH_Update = async (req: Request, res: Response) => {
  if (!ScopeManager.isScopeAllowedForSession("admin:profile:write", res)) {
    return;
  }
  try {
    if (hasErrors(req, res)) return;
    const userId = req.body.target;
    delete req.body.target;
    const errors: any[] = [];
    const fields = Object.keys(req.body);
    // Any field name is invalid or is not editable by configuration value.
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      if (!Configuration.get("admin-api.user.profile.editable-fields").includes(field)) {
        errors.push({ msg: "Invalid value", param: field, location: "body" });
      }
      if (req.body[field] === "__unset__") {
        req.body[field] = null;
      }
    }
    if (errors.length) {
      return res
        .status(statusCodes.unauthorized)
        .json(new ErrorResponse(errorMessages.insufficientPrivileges, { errors }));
    }
    // Edit is not allow for any field for the current user according to the scopes.
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      const fieldSensitivityScore = userSchema[field as keyof typeof userSchema]?.sensitivityScore?.write;
      if (
        !ScopeManager.isScopeAllowed(
          `admin:profile:sensitive:${fieldSensitivityScore}:write`,
          res.locals?.oauth?.token?.scope
        )
      ) {
        return res
          .status(statusCodes.unauthorized)
          .json(new ErrorResponse(errorMessages.insufficientPrivileges, { field }));
      }
    }
    const currentUserRole = res.locals.user.role;
    const target = (await UserModel.findOne({ _id: userId })) as unknown as UserInterface;
    // Allow changing data only upto the current user's role score.
    if (!isRoleRankHigher(currentUserRole, target.role) && currentUserRole !== Role.SUPER_ADMIN) {
      return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
    }
    const role = req.body.role;
    if (role) {
      const allRoles = Object.values(Role);
      if (!allRoles.includes(role)) {
        return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      }
      if (!isRoleRankHigher(currentUserRole, role) && currentUserRole !== Role.SUPER_ADMIN) {
        return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
      }
    }
    const password = req.body.password;
    if (password) {
      req.body.password = await bcrypt.hash(password, bcryptConfig.salt);
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

export default PATCH_Update;
