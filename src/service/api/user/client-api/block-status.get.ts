import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/client-api/block-status.get" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { getBlockStatus } from "../../../../utils/block.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";

export const GET_BlockStatusValidator = [
  query("source").exists().isString().isLength({ min: 8, max: 128 }),
  query("target").exists().isString().isLength({ min: 8, max: 128 }),
];

const GET_BlockStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("client:social:block:read", res)) {
      return;
    };
    const sourceId = req.query.source as string;
    const targetId = req.query.target as string;
    const isBlocked = await getBlockStatus(sourceId, targetId, null);
    res.status(statusCodes.success).json(new SuccessResponse({ blocked: isBlocked }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_BlockStatus;
