import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { ScopeManager } from "../../../singleton/scope-manager";

const GET_Scopes = async (req: Request, res: Response) => {
  try {
    res.status(statusCodes.success).json(new SuccessResponse({ scopes: ScopeManager.getScopes() }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Scopes;
