import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/invite-codes.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { Role } from "../../../../singleton/role.js";
import { hasErrors } from "../../../../utils/api.js";

export const POST_UpdateValidator = [
  body("target").isString().isLength({ min: 1, max: 128 }),
  body("displayName").optional().isString().isLength({ min: 1, max: 128 }),
  body("ranking").optional().isInt({ min: 1 }),
  body("description").optional().isString().isLength({ min: 1, max: 512 }),
];

const POST_Update = async (req: Request, res: Response): Promise<void> => {
  if (hasErrors(req, res)) return;
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:roles:write", res)) {
      return;
    }
    const id = req.body.target;
    // Do not allow editing system roles
    const isSystemRole = Role.isSystemRole(id);
    if (isSystemRole) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.systemRoleUpdate));
      return;
    }
    // Scope can be modified only using the access API.
    if (req.body.scope) {
      delete req.body.scope;
    }
    const existingRole = await Role.getRole(id);
    if (!existingRole) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.notFound));
      return;
    }
    req.body.id = existingRole.id;
    delete req.body.target;
    const role = await Role.updateRole(req.body);
    res.status(statusCodes.success).json(new SuccessResponse({ role }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Update;

