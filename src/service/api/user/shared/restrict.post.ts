import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/restrict" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { hasErrors } from "../../../../utils/api";
import { flushUserInfoFromRedis } from "../../../../model/oauth";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const POST_RestrictValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("state").exists().isBoolean(),
  body("reason").optional().isString().isLength({ min: 8, max: 128 }),
];

const POST_Restrict = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:restrict:write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const reason = req.body.reason;
    const query = {
      $set: {
        isRestricted: state,
        restrictedDate: new Date(new Date().toUTCString()),
        restrictedReason: reason || null,
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

export default POST_Restrict;
