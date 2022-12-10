import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { mongo } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";

const Followers = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    FollowModel.aggregate([
      {
        $match: {
          user: new mongo.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "following",
          foreignField: "_id",
          as: "userFollowing",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followers",
          foreignField: "_id",
          as: "userFollowers",
        },
      },
      {
        $project: {
          _id: 0,
          "userFollowers.password": 0,
          "userFollowers.isRestricted": 0,
          "userFollowers.emailVerified": 0,
          "userFollowing.password": 0,
          "userFollowing.isRestricted": 0,
          "userFollowing.emailVerified": 0,
        },
      },
    ]).exec(function (err, doc) {
      console.log(err);
      res.status(statusCodes.success).json(new SuccessResponse(doc));
    });
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Followers;
