import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-following" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { useFollowingQuery } from "../../../../model/query/following";
import { body } from "express-validator";
import { Configuration } from "../../../../singleton/configuration";
import { attachProfilePicture } from "../../../../utils/profile-picture";
import { checkSubscription } from "../../../../utils/subscription";

export const GET_UserFollowingValidator = [body("target").exists().isString().isLength({ min: 8, max: 128 })];

const GET_UserFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.query.target as string;
    let limit: any = parseInt(req.query.limit as string);
    const offset = req.query.offset as string;
    if (!limit) {
      limit = Configuration.get("pagination.default-limit");
    }
    if (limit > Configuration.get("pagination.max-limit")) {
      limit = Configuration.get("pagination.max-limit");
    }
    const query = useFollowingQuery(userId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    FollowModel.aggregate(query).exec(async function (up, records) {
      if (up) {
        throw up;
      }
      for (let i = 0; i < records.length; i++) {
        checkSubscription(records[i].target);
        await attachProfilePicture(records[i].target);
      }
      res.status(statusCodes.success).json(new SuccessResponse({ records }));
    });
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserFollowing;
