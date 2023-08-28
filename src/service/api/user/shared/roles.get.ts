import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "admin-api/editable-fields" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import Role from "../../../../enum/role";
import { ScopeManager } from "../../../../singleton/scope-manager";
import { extractRank, findRoleRank } from "../../../../utils/role";

const GET_Roles = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("user.<ENTITY>.configuration.read", res)) {
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
