import { Response } from "express";
import FollowModel from "../model/mongo/follow";
import UserModel, { IUser, IUserProjection } from "../model/mongo/user";
import { Configuration } from "../singleton/configuration";
import { errorMessages, statusCodes } from "./http-status";
import { ErrorResponse } from "./response";
import { FollowStatus } from "../enum/follow-status";

export const canRequestFollowerInfo = async ({
  sourceId,
  targetId,
  target,
  res,
}: {
  sourceId: string;
  targetId?: string;
  target?: IUser;
  res?: Response;
}): Promise<boolean> => {
  let user = target;
  if (!user) {
    user = (await UserModel.findOne({ _id: targetId }, IUserProjection).exec()) as unknown as IUser;
  }
  if (!user.isPrivate) {
    return true;
  }
  if (Configuration.get("privilege.can-use-follow-apis")) {
    const followEntry = (await FollowModel.findOne({
      $and: [{ targetId }, { sourceId }],
    }).exec()) as any;
    user = JSON.parse(JSON.stringify(user)) as IUser;
    if (!followEntry) {
      user.isFollowing = false;
    } else {
      if (followEntry.approved) {
        user.isFollowing = true;
      } else {
        user.isFollowing = false;
        user.requested = true;
      }
    }
    if (user.isFollowing) {
      return true;
    }
  }
  if (res) {
    res.status(statusCodes.forbidden).json(
      new ErrorResponse(errorMessages.forbidden, {
        reason: FollowStatus.NOT_FOLLOWING,
      })
    );
  }
  return false;
};
