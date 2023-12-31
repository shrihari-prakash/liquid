import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/accept-follow-request" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { updateFollowCount } from "../../../utils/follow";
import { hasErrors } from "../../../utils/api";
import { MongoDB } from "../../../singleton/mongo-db";
import { ScopeManager } from "../../../singleton/scope-manager";

export const PATCH_FollowRequestValidator = [body("request").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

const PATCH_FollowRequest = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:follow:accept", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const targetId = res.locals.oauth.token.user._id;
    const requestId = req.body.request;
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const query: any = {
      $and: [{ _id: requestId }, { targetId }],
    };
    const intermQuery = FollowModel.findOneAndUpdate(query, {
      approved: true,
    });
    if (sessionOptions) intermQuery.session(sessionOptions.session);
    const requestObject = (await intermQuery) as any;
    await updateFollowCount(requestObject.sourceId, targetId, 1);
    await MongoDB.commitTransaction(session);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default PATCH_FollowRequest;
