import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-following" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { validateErrors } from "../../../utils/api";

export const GET_FollowStatusValidator = [query("target").exists().isString().isLength({ min: 8, max: 64 })];

const GET_FollowStatus = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.query.target as string;
    const followEntry = (await FollowModel.findOne({
      $and: [{ targetId }, { sourceId }],
    }).exec()) as unknown as any;
    if (!followEntry) {
      res.status(statusCodes.success).json(new SuccessResponse({ following: false }));
    } else {
      if (followEntry.approved) {
        res.status(statusCodes.success).json(new SuccessResponse({ following: true }));
      } else {
        res.status(statusCodes.success).json(new SuccessResponse({ following: false, requested: true }));
      }
    }
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_FollowStatus;
