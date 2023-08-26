import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/following" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { useFollowingQuery } from "../../../model/query/following";
import { checkSubscription } from "../../../utils/subscription";
import { attachProfilePicture } from "../../../utils/profile-picture";
import { getPaginationLimit } from "../../../utils/pagination";
import { ScopeManager } from "../../../singleton/scope-manager";
import { getBlockStatus } from "../../../utils/block";
import { canRequestFollowerInfo } from "../../../utils/user";

const GET_Following = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.delegated.follow.read", res)) {
      return;
    }
    let loggedInUserId = res.locals.oauth.token.user._id;
    // both `/users/following` and `/users/:userId/following` share the same code. If there is a userId in params,
    // then we do some additional checks like if the target user has blocked the one requesting the API
    // and if the requesting user is following the target user if it is not a private account.
    const targetId = req.params.userId;
    if (targetId) {
      // The first two parameters reversed because we need to find if the target has blocked the source.
      const isBlocked = await getBlockStatus(targetId, loggedInUserId, res, true);
      if (isBlocked) return;
      const isFollowerInfoAllowed = await canRequestFollowerInfo({ sourceId: loggedInUserId, targetId, res });
      if (!isFollowerInfoAllowed) return;
      loggedInUserId = targetId;
    }
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    const query = useFollowingQuery(loggedInUserId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    for (let i = 0; i < records.length; i++) {
      checkSubscription(records[i].target);
      await attachProfilePicture(records[i].target);
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Following;
