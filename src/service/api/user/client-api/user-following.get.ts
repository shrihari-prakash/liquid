import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/client-api/user-following.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import FollowModel from "../../../../model/mongo/follow.js";
import { useFollowingQuery } from "../../../../query/following.js";
import { getPaginationLimit } from "../../../../utils/pagination.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { hydrateUserProfile } from "../../../../utils/user.js";

export const GET_UserFollowingValidator = [query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

const GET_UserFollowing = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("client:social:follow:read", res)) {
      return;
    };
    const userId = req.query.target as string;
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query = useFollowingQuery(userId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    for (let i = 0; i < records.length; i++) {
      await hydrateUserProfile(records[i].target);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserFollowing;
