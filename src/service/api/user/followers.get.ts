import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/followers.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { useFollowersQuery } from "../../../model/query/followers";
import { getPaginationLimit } from "../../../utils/pagination";
import { ScopeManager } from "../../../singleton/scope-manager";
import { getBlockStatus } from "../../../utils/block";
import { canRequestFollowerInfo, hydrateUserProfile } from "../../../utils/user";

const GET_Followers = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:read", res)) {
      return;
    }
    let loggedInUserId = res.locals.oauth.token.user._id;
    // both `/users/followers` and `/users/:userId/followers` share the same code. If there is a userId in params,
    // then we do some additional checks like if the target user has blocked the one requesting the API
    // and if the requesting user is following the target user if it is a private account.
    const targetId = req.params.userId;
    if (targetId) {
      // The first two parameters reversed because we need to find if the target has blocked the source.
      const isBlocked = await getBlockStatus(targetId, loggedInUserId, res);
      if (isBlocked) return;
      const isFollowerInfoAllowed = await canRequestFollowerInfo({ sourceId: loggedInUserId, targetId, res });
      if (!isFollowerInfoAllowed) return;
      loggedInUserId = targetId;
    }
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    // If the userId param exists, loggedInUserId is set to the param value in the previous lines for the sake of the query.
    const query = useFollowersQuery(loggedInUserId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    const records = await FollowModel.aggregate(query).exec();
    for (let i = 0; i < records.length; i++) {
      await hydrateUserProfile(records[i].source, { delegatedMode: true });
    }
    res.status(statusCodes.success).json(new SuccessResponse({ records }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Followers;
