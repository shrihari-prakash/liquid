import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/resend-verification.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { hasErrors } from "../../../utils/api.js";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { Mailer } from "../../../singleton/mailer.js";
import { VerificationCodeType } from "../../../enum/verification-code.js";

export const GET_ResendVerificationValidator = [
  query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
];

const GET_ResendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    if (hasErrors(req, res)) return;
    const target = req.query.target as string;
    const existingUser = (await UserModel.findOne({ _id: target }).exec()) as unknown as UserInterface;
    if (!existingUser) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    if (existingUser.emailVerified) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    await Mailer.generateAndSendEmailVerification(existingUser, VerificationCodeType.SIGNUP);
    res.status(statusCodes.success).json(new SuccessResponse("Verification email resent successfully."));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_ResendVerification;
