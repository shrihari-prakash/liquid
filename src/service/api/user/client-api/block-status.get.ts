import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/block-status" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { getBlockStatus } from "../../../../utils/block";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const GET_BlockStatusValidator = [
  query("source").exists().isString().isLength({ min: 8, max: 128 }),
  query("target").exists().isString().isLength({ min: 8, max: 128 }),
];

const GET_BlockStatus = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.client.block.read", res)) {
      return;
    };
    const sourceId = req.query.source as string;
    const targetId = req.query.target as string;
    const isBlocked = await getBlockStatus(sourceId, targetId, null);
    res.status(statusCodes.success).json(new SuccessResponse({ blocked: isBlocked }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_BlockStatus;
