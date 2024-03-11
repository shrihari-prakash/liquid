import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/following.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import FollowModel from "../../../model/mongo/follow.js";
import { useFollowingQuery } from "../../../query/following.js";
import { getPaginationLimit } from "../../../utils/pagination.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { getBlockStatus } from "../../../utils/block.js";
import { isFollowing, hydrateUserProfile, stripSensitiveFieldsForNonFollowerGet } from "../../../utils/user.js";
import { FollowStatus } from "../../../enum/follow-status.js";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user.js";

const GET_Following = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:read", res)) {
      return;
    }
    const loggedInUserId = res.locals.oauth.token.user._id;
    // both `/users/following` and `/users/:userId/following` share the same code. If there is a userId in params,
    // then we do some additional checks like if the target user has blocked the one requesting the API
    // and if the requesting user is following the target user if it is a private account.
    let targetId = req.params.userId;
    if (targetId) {
      const user = (await UserModel.findOne({ _id: targetId }, UserProjection)
        .lean()
        .exec()) as unknown as UserInterface;
      // The first two parameters reversed because we need to find if the target has blocked the source.
      const isBlocked = await getBlockStatus(targetId, loggedInUserId, res, true);
      if (isBlocked) return;
      const followResults = await isFollowing({ sourceId: loggedInUserId, targets: [user] });
      if (user.isPrivate && !followResults.results[0]) {
        return res.status(statusCodes.forbidden).json(
          new ErrorResponse(errorMessages.forbidden, {
            reason: FollowStatus.NOT_FOLLOWING,
          })
        );
      }
    } else {
      targetId = loggedInUserId;
    }
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query = useFollowingQuery(targetId, limit, loggedInUserId);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    const following = [];
    for (let i = 0; i < records.length; i++) {
      const target = records[i].target;
      following.push(target);
      await hydrateUserProfile(target, { delegatedMode: true });
    }
    // Strip out some information of users that the current user is not following.
    const { negativeIndices } = await isFollowing({ sourceId: loggedInUserId, targets: following });
    for (let i = 0; i < negativeIndices.length; i++) {
      const index = negativeIndices[i];
      stripSensitiveFieldsForNonFollowerGet(records[index].target);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Following;
