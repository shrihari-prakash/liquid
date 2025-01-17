import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/login-history.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { getPaginationLimit } from "../../../utils/pagination.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import LoginHistoryModel from "../../../model/mongo/login-history.js";

const GET_LoginHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:login-history:read", res)) {
      return;
    }
    const target = res.locals.oauth.token.user._id;
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query: any = { targetId: target };
    if (offset) {
      query.createdAt = { $gt: new Date(offset) };
    }
    const records = await LoginHistoryModel.find(query).sort({ createdAt: -1 }).limit(limit);
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_LoginHistory;
