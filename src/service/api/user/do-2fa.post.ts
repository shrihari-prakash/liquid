import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/do-2fa.post" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { isValidObjectId } from "mongoose";
import { hasErrors } from "../../../utils/api.js";
import VerificationCodeModel from "../../../model/mongo/verification-code.js";
import { VerificationCodeType } from "../../../enum/verification-code.js";
import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { Configuration } from "../../../singleton/configuration.js";
import LoginHistoryModel, { LoginHistoryInterface } from "../../../model/mongo/login-history.js";
import { LoginFailure } from "../../../enum/login-failure.js";

export const POST_Do2FAValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("code").exists().isString().isLength({ min: 3, max: 128 }),
  body("sessionHash").exists().isString().isLength({ min: 3, max: 128 }),
];

const POST_Do2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const code = req.body.code;
    const dbCode = await VerificationCodeModel.findOne({ $and: [{ belongsTo: target }, { code }] }).exec();
    if (!dbCode || dbCode.type !== VerificationCodeType.LOGIN || dbCode.sessionHash !== req.body.sessionHash) {
      if (Configuration.get("user.login.record-failed-attempts")) {
        const loginMeta: LoginHistoryInterface = { ...req.session.loginMeta } as any;
        loginMeta.success = false;
        loginMeta.reason = LoginFailure.MFA_REJECTED;
        await new LoginHistoryModel(loginMeta).save();
        log.info("Login metadata saved to database %o.", loginMeta);
      }
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    await VerificationCodeModel.deleteOne({ code });
    const user = (await UserModel.findOne({ _id: target }).exec()) as unknown as UserInterface;
    req.session.user = user;
    req.session.loggedInAt = new Date().toISOString();
    if (Configuration.get("user.login.record-successful-attempts")) {
      const loginMeta = req.session.loginMeta;
      await new LoginHistoryModel(loginMeta).save();
      log.info("Login metadata saved to database %o.", loginMeta);
    }
    req.session.save(function (err) {
      if (err) {
        log.error(err);
        return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
      }
      return res.status(statusCodes.success).json(new SuccessResponse({ userInfo: user }));
    });
  } catch (err: any) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Do2FA;

