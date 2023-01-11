import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-following" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { useFollowingQuery } from "../../../../model/query/following";
import { IUser } from "../../../../model/mongo/user";

const GET_FollowStatus = async (req: Request, res: Response) => {
  try {
    const sourceId = req.query.source as string;
    const targetId = req.query.target as string;
    const isFollowing = (await FollowModel.findOne({
      $and: [{ targetId }, { sourceId }],
    }).exec()) as unknown as IUser;
    res
      .status(statusCodes.success)
      .json(new SuccessResponse({ following: isFollowing ? true : false }));
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_FollowStatus;
