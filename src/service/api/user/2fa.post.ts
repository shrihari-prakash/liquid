import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/2fa" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";
import { hasErrors } from "../../../utils/api";
import { ScopeManager } from "../../../singleton/scope-manager";

export const POST_2FAValidator = [body("state").exists().isBoolean()];

const POST_2FA = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:2fa:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const state = req.body.state;
    await UserModel.updateOne({ _id: userId }, { $set: { "2faEnabled": state, "2faMedium": "email" } });
    return res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err: any) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_2FA;
