import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "system/settings.get" });

import { Request, Response } from "express";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { Role } from "../../../singleton/role.js";

const GET_List = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("delegated:roles:read", res)) {
      return;
    }
    const roles = Role.getRoles();
    const rolesArray = Array.from(roles, ([_, value]) => {
      if (Role.isSystemRole(value.id)) {
        (value as any).system = true;
      }
      return value;
    });
    return res.status(statusCodes.success).json(new SuccessResponse({ roles: rolesArray }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_List;

