import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow-requests.get" });

import { Request, Response } from "express";
import { mongo } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { ScopeManager } from "../../../singleton/scope-manager";
import { hydrateUserProfile } from "../../../utils/user";

const GET_FollowRequests = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:read", res)) {
      return;
    }
    const userId = res.locals.oauth.token.user._id;
    const records = await FollowModel.aggregate([
      {
        $match: {
          $and: [{ targetId: new mongo.ObjectId(userId) }, { approved: false }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sourceId",
          foreignField: "_id",
          as: "source",
        },
      },
      { $unwind: "$source" },
      {
        $project: {
          sourceId: 0,
          targetId: 0,
          __v: 0,
          "source.password": 0,
          "source.isRestricted": 0,
          "source.emailVerified": 0,
        },
      },
    ]).exec();
    for (let i = 0; i < records.length; i++) {
      await hydrateUserProfile(records[i].source);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_FollowRequests;

