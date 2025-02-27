import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/private.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { hasErrors } from "../../../utils/api.js";
import UserModel from "../../../model/mongo/user.js";
import FollowModel from "../../../model/mongo/follow.js";
import { MongoDB } from "../../../singleton/mongo-db.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

export const POST_PrivateValidator = [body("state").exists().isBoolean()];

const POST_Private = async (req: Request, res: Response): Promise<void> => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const state = req.body.state;
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const intermQuery1 = UserModel.updateOne({ _id: userId }, { $set: { isPrivate: state } });
    if (sessionOptions) intermQuery1.session(sessionOptions.session);
    await intermQuery1;
    // Accept all pending follow requests.
    if (state === false) {
      const requestsToApprove = await FollowModel.find({
        $and: [{ targetId: userId }, { approved: false }],
      });
      if (requestsToApprove.length) {
        const intermQuery2 = FollowModel.updateMany({ targetId: userId }, { $set: { approved: true } });
        if (sessionOptions) intermQuery2.session(sessionOptions.session);
        const result = (await intermQuery2) as any;
        // Update follower count for the user going public.
        const intermQuery3 = UserModel.updateOne({ _id: userId }, { $inc: { followerCount: result.modifiedCount } });
        if (sessionOptions) intermQuery3.session(sessionOptions.session);
        // Update folowing counts of the users whose requests were approved.
        await intermQuery3;
        const intermQuery4 = UserModel.updateMany(
          {
            _id: { $in: requestsToApprove.map((request) => request.sourceId) },
          },
          { $inc: { followingCount: 1 } }
        );
        if (sessionOptions) intermQuery4.session(sessionOptions.session);
        await intermQuery4;
      }
      await MongoDB.commitTransaction(session);
      res.status(statusCodes.success).json(new SuccessResponse({ acceptedCount: requestsToApprove.length }));
      return;
    } else {
      await MongoDB.commitTransaction(session);
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Private;
