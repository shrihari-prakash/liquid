import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUser, IUserProjection } from "../../../model/mongo/user";
import { getBlockStatus } from "../../../utils/block";
import { checkSubscription } from "../../../utils/subscription";
import { attachProfilePicture } from "../../../utils/profile-picture";
import { ScopeManager } from "../../../singleton/scope-manager";
import { canRequestNonFollowerInfo } from "../../../utils/user";
import { FollowStatus } from "../../../enum/follow-status";

const GET__UserId = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.delegated.all", res)) {
      return;
    }
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.params.userId;
    // The first two parameters reversed because we need to find if the target has blocked the source.
    const isBlocked = await getBlockStatus(targetId, sourceId, res);
    if (isBlocked)
      return res.status(statusCodes.forbidden).json(
        new ErrorResponse(errorMessages.forbidden, {
          reason: FollowStatus.BLOCKED,
        })
      );
    let user = (await UserModel.findOne({ _id: targetId }, IUserProjection).exec()) as unknown as IUser;
    const nonFollowerInfoAllowed = await canRequestNonFollowerInfo(sourceId, null, user);
    if (!nonFollowerInfoAllowed) {
      // @ts-expect-error
      user.email = undefined;
      // @ts-expect-error
      user.phone = undefined;
      // @ts-expect-error
      user.secondaryEmail = undefined;
      // @ts-expect-error
      user.secondaryPhone = undefined;
    }
    checkSubscription(user);
    await attachProfilePicture(user);
    res.status(statusCodes.success).json(new SuccessResponse({ user }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET__UserId;
