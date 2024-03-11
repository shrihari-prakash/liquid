import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/:userId.get" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user.js";
import { getBlockStatus } from "../../../utils/block.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { isFollowing, hydrateUserProfile, stripSensitiveFieldsForNonFollowerGet } from "../../../utils/user.js";

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
    const followResults = await isFollowing({ sourceId, targets: [user] });
    if (user.isPrivate && !followResults.results[0]) {
      user = stripSensitiveFieldsForNonFollowerGet(user);
    }
    await hydrateUserProfile(user, { delegatedMode: true });
    res.status(statusCodes.success).json(new SuccessResponse({ user }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET__UserId;
