import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/login-history.get" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { getPaginationLimit } from "../../../../utils/pagination.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import LoginHistoryModel from "../../../../model/mongo/login-history.js";

export const GET_LoginHistoryValidator = [
  query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
];

const GET_LoginHistory = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:login-history:read", res)) {
      return;
    }
    const target = req.query.target;
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
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_LoginHistory;
