import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/delete-follow-request" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { hasErrors } from "../../../utils/api";
import { updateFollowCount } from "../../../utils/follow";
import { MongoDB } from "../../../singleton/mongo-db";
import { ScopeManager } from "../../../singleton/scope-manager";

export const DELETE_FollowEntryValidator = [body("target").exists().isString().isLength({ min: 8, max: 64 })];

const DELETE_FollowEntry = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.delegated.follow.write.remove-follower", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const entryId = req.body.target;
    const query: any = { $and: [{ _id: entryId }] };
    const requestObject = (await FollowModel.findOne(query)) as any;
    if (!requestObject.sourceId.equals(userId) && !requestObject.targetId.equals(userId)) {
      res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
      return;
    }
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const intermQuery = FollowModel.deleteOne(requestObject._id);
    if (sessionOptions) intermQuery.session(sessionOptions.session);
    await intermQuery;
    if (requestObject.approved) {
      await updateFollowCount(requestObject.sourceId, requestObject.targetId, -1, sessionOptions);
    }
    await MongoDB.commitTransaction(session);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default DELETE_FollowEntry;
