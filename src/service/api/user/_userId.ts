import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUser } from "../../../model/mongo/user";
import FollowModel from "../../../model/mongo/follow";

const GetUser = async (req: Request, res: Response) => {
  try {
    const targetId = req.params.userId;
    const sourceId = res.locals.oauth.token.user._id;
    const user = (await UserModel.findOne({
      _id: targetId,
    }).exec()) as unknown as IUser;
    if (user.isPrivate) {
      const isFollowing = (await FollowModel.findOne({
        $and: [{ targetId }, { sourceId }],
      }).exec()) as unknown as IUser;
      if (!isFollowing) {
        return res
          .status(statusCodes.forbidden)
          .json(new ErrorResponse(errorMessages.accessDenied));
      }
    }
    res.status(statusCodes.success).json(new SuccessResponse({ user }));
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GetUser;
