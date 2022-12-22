import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUser } from "../../../model/mongo/user";
import FollowModel from "../../../model/mongo/follow";

const _UserId = async (req: Request, res: Response) => {
  try {
    const targetId = req.params.userId;
    const sourceId = res.locals.oauth.token.user._id;
    const user = (await UserModel.findOne(
      { _id: targetId },
      {
        _id: 1,
        username: 1,
        firstName: 1,
        middleName: 1,
        lastName: 1,
        profilePictureUrl: 1,
        followingCount: 1,
        followerCount: 1,
        isPrivate: 1,
        email: 1,
        phone: 1,
        secondaryEmail: 1,
        secondaryPhone: 1,
        isBanned: 1,
        isRestricted: 1,
      }
    ).exec()) as unknown as IUser;
    if (user.isPrivate) {
      const isFollowing = (await FollowModel.findOne({
        $and: [{ targetId }, { sourceId }],
      }).exec()) as unknown as IUser;
      if (!isFollowing) {
        // @ts-expect-error
        delete user.email;
        // @ts-expect-error
        delete user.phone;
        // @ts-expect-error
        delete user.secondaryEmail;
        // @ts-expect-error
        delete user.secondaryPhone;
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

export default _UserId;
