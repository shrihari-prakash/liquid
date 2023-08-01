import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/subscription" });

import { Request, Response } from "express";
import moment from "moment";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { hasErrors } from "../../../../utils/api";
import { Configuration } from "../../../../singleton/configuration";
import { flushUserInfoFromRedis } from "../../../../model/oauth";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const POST_SubscriptionValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("state").exists().isBoolean(),
  body("expiry").optional().isISO8601(),
  body("tier").optional().isString().isLength({ max: 128 }),
];

const POST_Subscription = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("user.<ENTITY>.profile.subscription.read", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const tier = req.body.tier;
    const expiry = req.body.expiry;
    if (state === true && !expiry) {
      const errors = [
        {
          msg: "Invalid value",
          param: "expiry",
          location: "body",
        },
      ];
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    if (tier && !Configuration.get("user.subscription.tier-list").includes(tier)) {
      const errors = [
        {
          msg: "Invalid value",
          param: "tier",
          location: "body",
        },
      ];
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    const query = {
      $set: {
        isSubscribed: state,
        subscriptionExpiry: moment(expiry).toDate(),
        subscriptionTier: tier || null,
      },
    };
    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Subscription;
