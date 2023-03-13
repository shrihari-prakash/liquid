import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/unblock" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { validateErrors } from "../../../utils/api";
import BlockModel from "../../../model/mongo/block";

export const POST_UnblockValidator = [body("target").exists().isString().isLength({ min: 8, max: 64 })];

const POST_Unblock = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    const result = await BlockModel.deleteOne({
      sourceId,
      targetId,
    });
    if (!result.deletedCount) {
      return res.status(statusCodes.success).json(new SuccessResponse());
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Unblock;
