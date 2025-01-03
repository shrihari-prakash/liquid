import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/invite-codes.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { Role } from "../../../../singleton/role.js";
import { hasErrors } from "../../../../utils/api.js";

export const POST_CreateValidator = [
  body("id").isString().isLength({ min: 1, max: 128 }).matches(/^[a-zA-Z0-9_]+$/),
  body("displayName").isString().isLength({ min: 1, max: 128 }),
  body("ranking").isInt({ min: 1 }),
  body("description").optional().isString().isLength({ min: 1, max: 512 }),
];

const POST_Create = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:roles:write", res)) {
      return;
    }
    // Scope can be modified only using the access API.
    if (req.body.scope) {
      req.body.scope = [];
    }
    const role = await Role.createRole(req.body);
    res.status(statusCodes.success).json(new SuccessResponse({ role }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;

