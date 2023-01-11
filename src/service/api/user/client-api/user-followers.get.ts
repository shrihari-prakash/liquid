import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-followers" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { useFollowersQuery } from "../../../../model/query/followers";

const GET_UserFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.query.target as string;
    FollowModel.aggregate(useFollowersQuery(userId)).exec(function (up, users) {
      if (up) {
        throw up;
      }
      res.status(statusCodes.success).json(new SuccessResponse({ users }));
    });
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserFollowers;
