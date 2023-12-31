import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/reset-password.post" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import UserModel from "../../../model/mongo/user";
import VerificationCodeModel from "../../../model/mongo/verification-code";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { bcryptConfig } from "./create.post";
import { hasErrors } from "../../../utils/api";
import { VerificationCodeType } from "../../../enum/verification-code";

export const POST_ResetPasswordValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("code").exists().isString().isLength({ min: 3, max: 128 }),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
];

const POST_ResetPassword = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const { code, password: passwordBody, target } = req.body;
    const dbCode = await VerificationCodeModel.findOne({ $and: [{ belongsTo: target }, { code }] }).exec();
    if (!dbCode || dbCode.type !== VerificationCodeType.PASSWORD_RESET) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    }
    const password = await bcrypt.hash(passwordBody, bcryptConfig.salt);
    await UserModel.updateOne({ _id: dbCode.belongsTo }, { $set: { password: password } });
    VerificationCodeModel.deleteOne({ code }).exec();
    return res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_ResetPassword;
