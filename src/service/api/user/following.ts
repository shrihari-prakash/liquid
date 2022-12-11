import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { mongo } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";

const Following = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    FollowModel.aggregate([
      {
        $match: {
          $and: [{ sourceId: new mongo.ObjectId(userId) }, { approved: true }],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "targetId",
          foreignField: "_id",
          as: "target",
        },
      },
      {
        $project: {
          _id: 0,
          "target.password": 0,
          "target.isRestricted": 0,
          "target.emailVerified": 0,
        },
      },
    ]).exec(function (up, doc) {
      if (up) {
        throw up;
      }
      res.status(statusCodes.success).json(new SuccessResponse(doc));
    });
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Following;
