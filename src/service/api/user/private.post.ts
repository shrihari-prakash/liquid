import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/switch-private" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { hasErrors } from "../../../utils/api";
import UserModel from "../../../model/mongo/user";
import FollowModel from "../../../model/mongo/follow";
import { MongoDB } from "../../../singleton/mongo-db";
import { ScopeManager } from "../../../singleton/scope-manager";

export const POST_PrivateValidator = [body("state").exists().isBoolean()];

const POST_Private = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSession("user.delegated.profile.write", res)) {
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
      return res.status(statusCodes.success).json(new SuccessResponse({ acceptedCount: requestsToApprove.length }));
    } else {
      await MongoDB.commitTransaction(session);
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Private;
