import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/follow.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import FollowModel from "../../../model/mongo/follow.js";
import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { updateFollowCount } from "../../../utils/follow.js";
import { hasErrors } from "../../../utils/api.js";
import { FollowStatus } from "../../../enum/follow-status.js";
import { getBlockStatus } from "../../../utils/block.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import { MongoDB } from "../../../singleton/mongo-db.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

export const POST_FollowValidator = [body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

function sendSuccess(res: Response, status: string) {
  res.status(statusCodes.success).json(new SuccessResponse({ status }));
}

const POST_Follow = async (req: Request, res: Response): Promise<void> => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:request", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    if (sourceId === targetId) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    const isBlocked = await getBlockStatus(targetId, sourceId, res, true);
    if (isBlocked) return;
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const query: any = {
      targetId,
      sourceId,
    };
    const target = (await UserModel.findOne({
      _id: targetId,
    }).exec()) as unknown as UserInterface;
    if (target.isPrivate) {
      query.approved = false;
      await new FollowModel(query).save(sessionOptions);
      await MongoDB.commitTransaction(session);
      sendSuccess(res, FollowStatus.REQUESTED);
      Pusher.publish(new PushEvent(PushEventList.USER_FOLLOW_REQUEST, { source: sourceId, target: targetId }));
    } else {
      await new FollowModel(query).save(sessionOptions);
      await updateFollowCount(sourceId, targetId, 1, sessionOptions);
      await MongoDB.commitTransaction(session);
      sendSuccess(res, FollowStatus.FOLLOWING);
      Pusher.publish(new PushEvent(PushEventList.USER_FOLLOW, { source: sourceId, target: targetId }));
    }
  } catch (err: any) {
    await MongoDB.abortTransaction(session);
    if (err?.message?.includes("E11000")) {
      return sendSuccess(res, FollowStatus.DUPLICATE);
    }
    log.error(err);
    res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError, { transactionId: session }));
  }
};

export default POST_Follow;
