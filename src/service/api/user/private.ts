import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/switch-private" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";
import { validateErrors } from "../../../utils/api";
import FollowModel from "../../../model/mongo/follow";

export const SwitchPrivateValidator = [body("state").exists().isBoolean()];

const SwitchPrivate = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const userId = res.locals.oauth.token.user._id;
    const state = req.body.state;
    await UserModel.updateOne({ _id: userId }, { $set: { isPrivate: state } });
    // Accept all pending follow requests.
    if (state === false) {
      const requestsToApprove = await FollowModel.find({
        $and: [{ targetId: userId }, { approved: false }],
      });
      if (requestsToApprove.length) {
        const result = (await FollowModel.updateMany(
          { targetId: userId },
          { $set: { approved: true } }
        )) as any;
        // Update follower count for the user going public.
        await UserModel.updateOne(
          { _id: userId },
          { $inc: { followerCount: result.modifiedCount } }
        );
        // Update folowing counts of the users whose requests were approved.
        await UserModel.updateMany(
          {
            _id: { $in: requestsToApprove.map((request) => request.sourceId) },
          },
          { $inc: { followingCount: 1 } }
        );
      }
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default SwitchPrivate;
