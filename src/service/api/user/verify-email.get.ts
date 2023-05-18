import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/verify-email" });

import { Request, Response } from "express";
import { query } from "express-validator";

import UserModel from "../../../model/mongo/user";
import VerificationCodeModel from "../../../model/mongo/verification-code";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { hasErrors } from "../../../utils/api";

export const GET_VerifyEmailValidator = [query("code").exists().isString()];

const GET_VerifyEmail = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const code: string = req.query.code as string;
    const dbCode = await VerificationCodeModel.findOne({ code }).exec();
    if (!dbCode) {
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
