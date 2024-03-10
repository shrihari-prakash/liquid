import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/unfollow.post" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import FollowModel from "../../../model/mongo/follow.js";
import { updateFollowCount } from "../../../utils/follow.js";
import { hasErrors } from "../../../utils/api.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import { MongoDB } from "../../../singleton/mongo-db.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

const POST_Unfollow = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:unfollow", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    if (sourceId === targetId)
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const intermQuery = FollowModel.deleteOne({
      sourceId,
      targetId,
      approved: true,
    });
    if (sessionOptions) intermQuery.session(sessionOptions.session);
    const result = await intermQuery;
    if (!result.deletedCount) {
      return res.status(statusCodes.success).json(new SuccessResponse());
    }
    await updateFollowCount(sourceId, targetId, -1, sessionOptions);
    await MongoDB.commitTransaction(session);
    res.status(statusCodes.success).json(new SuccessResponse());
    Pusher.publish(new PushEvent(PushEventList.USER_UNFOLLOW, { source: sourceId, target: targetId }));
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Unfollow;
