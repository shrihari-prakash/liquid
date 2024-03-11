import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/admin-api/verify.post" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { flushUserInfoFromRedis } from "../../../../model/oauth/oauth.js";

export const POST_VerifyValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("state").exists().isBoolean(),
];

const POST_Verify = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:profile:verifications:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const myId = res.locals.oauth.token.user._id;
    const query = { $set: { verified: state, verifiedDate: new Date(new Date().toUTCString()), verifiedBy: myId } };
    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Verify;
