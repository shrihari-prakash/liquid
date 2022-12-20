import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/following" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { useFollowingQuery } from "../../../model/query/following";

const Following = async (_: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    FollowModel.aggregate(useFollowingQuery(userId)).exec(function (up, users) {
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

export default Following;
