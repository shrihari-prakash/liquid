import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import UserModel, { IUser } from "../../../model/mongo/user";
import { updateFollowCount } from "../../../utils/follow";
import { hasErrors } from "../../../utils/api";
import { FollowStatus } from "../../../enum/follow-status";
import { getBlockStatus } from "../../../utils/block";
import { Pusher } from "../../../singleton/pusher";
import { PushEvent } from "../../pusher/pusher";
import { PushEventList } from "../../../enum/push-events";
import { MongoDB } from "../../../singleton/mongo-db";

export const POST_FollowValidator = [body("target").exists().isString().isLength({ min: 8, max: 64 })];

function sendSuccess(res: Response, status: string) {
  res.status(statusCodes.success).json(new SuccessResponse({ status }));
}

const POST_Follow = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (hasErrors(req, res)) return;
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    if (sourceId === targetId)
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
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
    }).exec()) as unknown as IUser;
    if (target.isPrivate) {
      query.approved = false;
      await new FollowModel(query).save(sessionOptions);
      await MongoDB.commitTransaction(session);
      sendSuccess(res, FollowStatus.REQUESTED);
    } else {
      await new FollowModel(query).save(sessionOptions);
      await updateFollowCount(sourceId, targetId, 1, sessionOptions);
      await MongoDB.commitTransaction(session);
      sendSuccess(res, FollowStatus.FOLLOWING);
    }
    Pusher.publish(new PushEvent(PushEventList.USER_FOLLOW, { source: sourceId, target: targetId }));
  } catch (err: any) {
    if (err?.message?.includes("E11000")) {
      sendSuccess(res, FollowStatus.DUPLICATE);
    }
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError, { transactionId: session }));
  }
};

export default POST_Follow;
