import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/follow-status.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import FollowModel from "../../../model/mongo/follow.js";
import { hasErrors } from "../../../utils/api.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

export const GET_FollowStatusValidator = [query("target").optional().isString().isLength({ max: 64 }).custom(isValidObjectId)];

const GET_FollowStatus = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:read", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const sourceId = res.locals.oauth.token.user._id;
    if (!req.params.userId && !req.query.target) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          errors: [
            {
              msg: "Invalid value",
              param: "target",
              location: "query",
            },
          ],
        })
      );
    }
    const targetId = req.params.userId || (req.query.target as string);
    if (sourceId === targetId)
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
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
