import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/verify-email.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import UserModel from "../../../model/mongo/user.js";
import VerificationCodeModel from "../../../model/mongo/verification-code.js";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { hasErrors } from "../../../utils/api.js";
import { VerificationCodeType } from "../../../enum/verification-code.js";

export const GET_VerifyEmailValidator = [
  query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  query("code").exists().isString(),
];

const GET_VerifyEmail = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const target: string = req.query.target as string;
    const code: string = req.query.code as string;
    const dbCode = await VerificationCodeModel.findOne({ $and: [{ belongsTo: target }, { code }] }).exec();
    if (!dbCode || dbCode.type !== VerificationCodeType.SIGNUP) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    }
    await UserModel.updateOne({ _id: dbCode.belongsTo }, { $set: { emailVerified: true } });
    VerificationCodeModel.deleteOne({ code }).exec();
    return res
      .status(statusCodes.success)
      .json(new SuccessResponse("Your email has been verified successfully. You can now login."));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_VerifyEmail;
