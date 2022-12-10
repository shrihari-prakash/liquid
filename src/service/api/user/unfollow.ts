import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { mongo } from "mongoose";
import { body, validationResult } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import UserModel from "../../../model/mongo/user";

const Unfollow = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          errors: errors.array(),
        })
      );
    }
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    const result = await FollowModel.deleteOne({
      targetId,
      sourceId,
    });
    if (!result.deletedCount) {
      return res.status(statusCodes.success).json(new SuccessResponse());
    }
    const p1 = UserModel.updateOne(
      { _id: sourceId },
      { $inc: { followingCount: -1 } }
    );
    const p2 = UserModel.updateOne(
      { _id: targetId },
      { $inc: { followerCount: -1 } }
    );
    Promise.all([p1, p2]).then(() =>
      res.status(statusCodes.success).json(new SuccessResponse())
    );
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Unfollow;
