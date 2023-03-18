import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client-api/subscription" });

import { Request, Response } from "express";
import moment from "moment";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api";
import { Configuration } from "../../../../singleton/configuration";

export const POST_SubscriptionValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("state").exists().isBoolean(),
  body("expiry").optional().isISO8601(),
  body("tier").optional().isString().isLength({ max: 128 }),
];

const POST_Subscription = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  try {
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
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Subscription;
