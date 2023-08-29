import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-following" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { hasErrors } from "../../../utils/api";
import { ScopeManager } from "../../../singleton/scope-manager";

export const GET_FollowStatusValidator = [query("target").optional().isString().isLength({ min: 8, max: 64 })];

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
