import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/patch" });

import { Request, Response } from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { IUser } from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";
import Role from "../../../../enum/role";
import { bcryptConfig } from "../create.post";
import { hasErrors } from "../../../../utils/api";
import { PATCH_MeValidator } from "../me.patch";
import { flushUserInfoFromRedis } from "../../../../model/oauth";
import { isRoleRankHigher } from "../../../../utils/role";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const PATCH_UserValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 64 }),
  ...PATCH_MeValidator,
];

const PATCH_User = async (req: Request, res: Response) => {
  if (!ScopeManager.isScopeAllowedForSession("user.admin.profile.write", res)) {
    return;
  };
  try {
    if (hasErrors(req, res)) return;
    const userId = req.body.target;
    delete req.body.target;
    const errors: any[] = [];
    Object.keys(req.body).forEach((key) => {
      if (!Configuration.get("admin-api.user.profile.editable-fields").includes(key)) {
        errors.push({
          msg: "Invalid value",
          param: key,
          location: "body",
        });
      }
    });
    if (errors.length) {
      return res
        .status(statusCodes.unauthorized)
        .json(new ErrorResponse(errorMessages.insufficientPrivileges, { errors }));
    }
    const currentUserRole = res.locals.user.role;
    const target = (await UserModel.findOne({ _id: userId })) as unknown as IUser;
    // Allow changing data only upto the level of the current user's role.
    if (!isRoleRankHigher(currentUserRole, target.role)) {
      return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
    }
    const role = req.body.role;
    if (role) {
      const allRoles = Object.values(Role);
      const editorRoles = Configuration.get("system.role.editor-roles");
      if (!allRoles.includes(role)) {
        return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      }
      if (!editorRoles.includes(currentUserRole) || !isRoleRankHigher(currentUserRole, role)) {
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

export default PATCH_User;
