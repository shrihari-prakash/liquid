import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/accept-follow-request" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { updateFollowCount } from "../../../utils/follow";
import { hasErrors } from "../../../utils/api";
import { MongoDB } from "../../../singleton/mongo-db";

export const PATCH_AcceptFollowRequestValidator = [body("request").exists().isString().isLength({ min: 8, max: 64 })];

const PATCH_AcceptFollowRequest = async (req: Request, res: Response) => {
  let session = "";
  try {
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

export default PATCH_AcceptFollowRequest;
