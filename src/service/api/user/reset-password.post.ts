import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";

import UserModel from "../../../model/mongo/user";
import verificationCodeModel from "../../../model/mongo/verification-code";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { bcryptConfig } from "./create.post";
import { validateErrors } from "../../../utils/api";

export const POST_ResetPasswordValidator = [
  body("code").exists().isString().isLength({ min: 3, max: 128 }),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
];

const POST_ResetPassword = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const { code, password: passwordBody } = req.body;
    const dbCode = await verificationCodeModel.findOne({ code }).exec();
    if (!dbCode) {
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError));
    }
    const password = await bcrypt.hash(passwordBody, bcryptConfig.salt);
    await UserModel.updateOne(
      { _id: dbCode.belongsTo },
      { $set: { password: password } }
    );
    verificationCodeModel.deleteOne({ code }).exec();
    return res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    console.log(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_ResetPassword;
