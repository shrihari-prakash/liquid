import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-following" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { useFollowingQuery } from "../../../../model/query/following";
import { attachProfilePicture } from "../../../../utils/profile-picture";
import { checkSubscription } from "../../../../utils/subscription";
import { getPaginationLimit } from "../../../../utils/pagination";

export const GET_UserFollowingValidator = [body("target").exists().isString().isLength({ min: 8, max: 128 })];

const GET_UserFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.query.target as string;
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query = useFollowingQuery(userId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    for (let i = 0; i < records.length; i++) {
      checkSubscription(records[i].target);
      await attachProfilePicture(records[i].target);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserFollowing;
