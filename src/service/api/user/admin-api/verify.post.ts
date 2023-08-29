import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/verify" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const POST_VerifyValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("state").exists().isBoolean(),
];

const POST_Verify = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:profile:verifications:write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const state = req.body.state;
    const query = { $set: { verified: state, verifiedDate: new Date(new Date().toUTCString()) } };
    await UserModel.updateOne({ _id: target }, query);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Verify;
