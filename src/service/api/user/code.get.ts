import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/code" });

import { Request, Response } from "express";
import { query } from "express-validator";

import UserModel, { UserInterface } from "../../../model/mongo/user";
import { hasErrors } from "../../../utils/api";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { Mailer } from "../../../singleton/mailer";
import { VerificationCodeType } from "../../../enum/verification-code";

export const GET_CodeValidator = [query("email").exists().isEmail()];

const GET_Code = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const { email } = req.query;
    const existingUser = (await UserModel.findOne({
      email,
    }).exec()) as unknown as UserInterface;
    if (!existingUser) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    } else {
      await Mailer.generateAndSendEmailVerification(existingUser, VerificationCodeType.PASSWORD_RESET);
      return res.status(statusCodes.created).json(new SuccessResponse({ target: existingUser._id }));
    }
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Code;
