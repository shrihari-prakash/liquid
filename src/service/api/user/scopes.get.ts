import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/scopes.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

const GET_Scopes = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(statusCodes.success).json(new SuccessResponse({ scopes: ScopeManager.getScopes() }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Scopes;
