import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/invite-codes.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { Role } from "../../../../singleton/role.js";
import UserModel from "../../../../model/mongo/user.js";
import { MongoDB } from "../../../../singleton/mongo-db.js";
import { hasErrors } from "../../../../utils/api.js";
import { Configuration } from "../../../../singleton/configuration.js";

export const POST_DeleteValidator = [body("target").isString().isLength({ min: 1, max: 128 })];

const POST_Delete = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:roles:delete", res)) {
      return;
    }
    const id = req.body.target;
    // do not allow deleting system roles
    const isSystemRole = Role.isSystemRole(id);
    if (isSystemRole) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.systemRoleDelete));
    }
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    await UserModel.updateMany({ role: id }, { role: Configuration.get("system.role.default") }, sessionOptions);
    await Role.deleteRole(id, sessionOptions);
    await MongoDB.commitTransaction(session);
    return res.status(statusCodes.success).json(new SuccessResponse({}));
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Delete;

