import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/restrict.post" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/cache.js";

export const POST_RestrictValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("state").exists().isBoolean(),
  body("reason").optional().isString().isLength({ min: 8, max: 128 }),
];

const POST_Restrict = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:restrict:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const reason = req.body.reason;
    const myId = res.locals.oauth.token.user._id;
    const query = {
      $set: {
        isRestricted: state,
        restrictedDate: new Date(new Date().toUTCString()),
        restrictedReason: reason || null,
        restrictedBy: myId,
      },
    };
    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Restrict;
