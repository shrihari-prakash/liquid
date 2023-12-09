import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/do-2fa" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { isValidObjectId } from "mongoose";
import { hasErrors } from "../../../utils/api";
import VerificationCodeModel from "../../../model/mongo/verification-code";
import { VerificationCodeType } from "../../../enum/verification-code";
import UserModel, { UserInterface } from "../../../model/mongo/user";

export const POST_Do2FAValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("code").exists().isString().isLength({ min: 3, max: 128 }),
];

const POST_Do2FA = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const code = req.body.code;
    const dbCode = await VerificationCodeModel.findOne({ $and: [{ belongsTo: target }, { code }] }).exec();
    if (!dbCode || dbCode.type !== VerificationCodeType.LOGIN) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    }
    await VerificationCodeModel.deleteOne({ code });
    const user = (await UserModel.findOne({ _id: target }).exec()) as unknown as UserInterface;
    req.session.save(function (err) {
      if (err) {
        log.error(err);
        return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
      }
      return res.status(statusCodes.success).json(new SuccessResponse({ userInfo: user }));
    });
  } catch (err: any) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Do2FA;