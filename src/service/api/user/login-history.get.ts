import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/followers" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { getPaginationLimit } from "../../../utils/pagination";
import { ScopeManager } from "../../../singleton/scope-manager";
import LoginHistoryModel from "../../../model/mongo/login-history";

const GET_LoginHistory = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:login-history:read", res)) {
      return;
    }
    const target = res.locals.oauth.token.user._id;
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query: any = { targetId: target };
    if (offset) {
      query.createdAt = { $lt: new Date(offset) };
    }
    const records = await LoginHistoryModel.find(query).limit(limit);
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_LoginHistory;
