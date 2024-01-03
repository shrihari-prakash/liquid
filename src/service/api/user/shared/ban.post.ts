import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/ban.post" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api";
import { flushUserInfoFromRedis } from "../../../../model/oauth";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const POST_BanValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("state").exists().isBoolean(),
  body("reason").optional().isString().isLength({ min: 8, max: 128 }),
];

const POST_Ban = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:ban:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const reason = req.body.reason;
    const myId = res.locals.oauth.token.user._id;
    const query = {
      $set: {
        isBanned: state,
        bannedDate: new Date(new Date().toUTCString()),
        bannedReason: reason || null,
        bannedBy: myId,
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

export default POST_Ban;
