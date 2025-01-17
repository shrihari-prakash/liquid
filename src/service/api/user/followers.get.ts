import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/followers.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import FollowModel from "../../../model/mongo/follow.js";
import { useFollowersQuery } from "../../../query/followers.js";
import { getPaginationLimit } from "../../../utils/pagination.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { getBlockStatus } from "../../../utils/block.js";
import { isFollowing, hydrateUserProfile, stripSensitiveFieldsForNonFollowerGet } from "../../../utils/user.js";
import { FollowStatus } from "../../../enum/follow-status.js";
import UserModel, { UserInterface, UserProjection } from "../../../model/mongo/user.js";

const GET_Followers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:read", res)) {
      return;
    }
    const loggedInUserId = res.locals.oauth.token.user._id;
    // both `/users/followers` and `/users/:userId/followers` share the same code. If there is a userId in params,
    // then we do some additional checks like if the target user has blocked the one requesting the API
    // and if the requesting user is following the target user if it is a private account.
    let targetId = req.params.userId;
    if (targetId) {
      const user = (await UserModel.findOne({ _id: targetId }, UserProjection)
        .lean()
        .exec()) as unknown as UserInterface;
      // The first two parameters reversed because we need to find if the target has blocked the source.
      const isBlocked = await getBlockStatus(targetId, loggedInUserId, res);
      if (isBlocked) return;
      const followResults = await isFollowing({ sourceId: loggedInUserId, targets: [user] });
      if (user.isPrivate && !followResults.results[0]) {
        res.status(statusCodes.forbidden).json(
          new ErrorResponse(errorMessages.forbidden, {
            reason: FollowStatus.NOT_FOLLOWING,
          }),
        );
        return;
      }
    } else {
      targetId = loggedInUserId;
    }
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    // If the userId param exists, loggedInUserId is set to the param value in the previous lines for the sake of the query.
    const query = useFollowersQuery(targetId, limit, loggedInUserId);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    const followers = [];
    for (let i = 0; i < records.length; i++) {
      const source = records[i].source;
      followers.push(source);
      await hydrateUserProfile(source, { delegatedMode: true });
    }
    // Strip out some information of users that the current user is not following.
    const { negativeIndices } = await isFollowing({ sourceId: loggedInUserId, targets: followers });
    for (let i = 0; i < negativeIndices.length; i++) {
      const index = negativeIndices[i];
      stripSensitiveFieldsForNonFollowerGet(records[index].source);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Followers;

