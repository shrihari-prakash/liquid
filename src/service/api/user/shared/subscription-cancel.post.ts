import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/subscription-cancel.post" });

import { Request, Response } from "express";
import moment from "moment";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/cache.js";

export const POST_SubscriptionCancelValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("cancelled").exists().isBoolean(),
];

const POST_SubscriptionCancel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:subscriptions:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;

    const target = req.body.target;
    const cancelled = req.body.cancelled;

    const query: any = {
      $set: {
        subscriptionCancelled: cancelled,
      },
    };

    if (cancelled === true) {
      query.$set.subscriptionCancelledAt = moment().toDate();
      query.$set.isSubscribed = false;
    } else {
      query.$set.subscriptionCancelledAt = null;
    }

    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_SubscriptionCancel;

