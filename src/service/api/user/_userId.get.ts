import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/:userId.get" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user";
import { getBlockStatus } from "../../../utils/block";
import { ScopeManager } from "../../../singleton/scope-manager";
import { canRequestFollowerInfo, hydrateUserProfile } from "../../../utils/user";
import { Configuration } from "../../../singleton/configuration";

const GET__UserId = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:read", res)) {
      return;
    }
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.params.userId;
    if (!isValidObjectId(targetId)) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          msg: "Invalid value",
          param: "userId",
          location: "param",
        })
      );
    }
    // The first two parameters reversed because we need to find if the target has blocked the source.
    const isBlocked = await getBlockStatus(targetId, sourceId, res);
    if (isBlocked) return;
    let user = (await UserModel.findOne({ _id: targetId }, UserProjection).exec()) as unknown as UserInterface;
    const isFollowerInfoAllowed = await canRequestFollowerInfo({ sourceId, target: user });
    if (!isFollowerInfoAllowed) {
      // @ts-expect-error
      user.email = undefined;
      // @ts-expect-error
      user.phone = undefined;
      // @ts-expect-error
      user.secondaryEmail = undefined;
      // @ts-expect-error
      user.secondaryPhone = undefined;
      if (Configuration.get("user.profile.custom-data.hide-for-non-followers")) {
        // @ts-expect-error
        user.customData = undefined;
      }
    }
    await hydrateUserProfile(user);
    res.status(statusCodes.success).json(new SuccessResponse({ user }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET__UserId;
