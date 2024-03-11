import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/roles.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import Role from "../../../../enum/role.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { extractRank, findRoleRank } from "../../../../utils/role.js";

const GET_Roles = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:configuration:read", res)) {
      return;
    }
    const roles = Object.values(Role).map((role) => {
      return {
        name: role,
        displayName: (role as string)
          .split("_")
          .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" "),
        rank: parseInt(extractRank(findRoleRank(role as string))),
      };
    });
    res.status(statusCodes.success).json(new SuccessResponse({ roles }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Roles;
