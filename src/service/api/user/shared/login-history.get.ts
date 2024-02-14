import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/login-history.get" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { getPaginationLimit } from "../../../../utils/pagination";
import { ScopeManager } from "../../../../singleton/scope-manager";
import LoginHistoryModel from "../../../../model/mongo/login-history";

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
