import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/unblock.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { hasErrors } from "../../../utils/api.js";
import BlockModel from "../../../model/mongo/block.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

export const POST_UnblockValidator = [body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

const POST_Unblock = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:block:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    if (sourceId === targetId) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    const result = await BlockModel.deleteOne({
      sourceId,
      targetId,
    });
    if (!result.deletedCount) {
      res.status(statusCodes.success).json(new SuccessResponse());
      return;
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Unblock;

