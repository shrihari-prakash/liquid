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
import { deleteUserIdFromRedis } from "../../../../model/oauth";

export const PATCH_UserValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 64 }),
  ...PATCH_MeValidator,
];

const exractRank = (roleRank: string) => {
  return (roleRank.match(/\(([^)]+)\)/) as string[])[1];
};

const findRoleRank = (role: string) => {
  const roleRanking = Configuration.get("system.role.ranking");
  return roleRanking.find((r: string) => r.split("(")[0] === role);
};

const isRoleRankHigher = (currentRole: string, comparisonRole: string) => {
  const currentRoleRank = exractRank(findRoleRank(currentRole));
  const comparisonRoleRank = exractRank(findRoleRank(comparisonRole));
  return parseInt(currentRoleRank) < parseInt(comparisonRoleRank);
};

const PATCH_User = async (req: Request, res: Response) => {
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
    const currentUserRole = res.locals.user.role;
    const target = (await UserModel.findOne({ _id: userId })) as unknown as IUser;
    // Allow changing data only upto the level of the current user's role.
    if (!isRoleRankHigher(currentUserRole, target.role)) {
      return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
    }
    const role = req.body.role;
    if (role) {
      const allRoles = Object.values(Role);
      const editorRoles = Configuration.get("system.role.editor-roles");
      if (!allRoles.includes(role)) {
        return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      }
      if (!editorRoles.includes(currentUserRole) || !isRoleRankHigher(currentUserRole, role)) {
        return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
      }
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
    await UserModel.updateOne({ _id: userId }, { $set: { ...req.body } }).exec();
    res.status(statusCodes.success).json(new SuccessResponse());
    deleteUserIdFromRedis(userId);
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
