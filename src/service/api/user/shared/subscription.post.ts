import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/subscription.post" });

import { Request, Response } from "express";
import moment from "moment";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/cache.js";

export const POST_SubscriptionValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("state").exists().isBoolean(),
  body("expiry").optional().isISO8601(),
  body("tier").optional().isString().isLength({ max: 128 }),
  body("subscriptionIdentifier")
    .optional()
    .custom((value) => typeof value === "string" || typeof value === "number"),
];

const POST_Subscription = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:subscriptions:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const tier = req.body.tier;
    const expiry = req.body.expiry;
    const subscriptionIdentifier = req.body.subscriptionIdentifier;

    if (state === true && !expiry) {
      const errors = [
        {
          msg: "Invalid value",
          param: "expiry",
          location: "body",
        },
      ];
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
      return;
    }
    if (tier && !Configuration.get("user.subscription.tier-list").includes(tier)) {
      const errors = [
        {
          msg: "Invalid value",
          param: "tier",
          location: "body",
        },
      ];
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
      return;
    }
    const query: any = {
      $set: {
        isSubscribed: state,
        subscriptionActivatedAt: moment().toDate(),
        subscriptionExpiry: moment(expiry).toDate(),
        subscriptionTier: tier || null,
      },
    };
    if (typeof subscriptionIdentifier !== "undefined") {
      query.$set.subscriptionIdentifier = subscriptionIdentifier;
    }

    // If tier is the base tier, ensure subscription is not marked as cancelled
    const baseTier = Configuration.get("user.subscription.base-tier");
    if (tier && tier === baseTier) {
      query.$set.subscriptionCancelled = false;
    }

    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Subscription;

