import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/create" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";

import UserModel, { IUser } from "../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import Role from "../../../enum/role";
import { hasErrors } from "../../../utils/api";
import { generateVerificationCode } from "../../../utils/verification-code/verification-code";

export const bcryptConfig = {
  salt: 10,
};

export const POST_CreateValidator = [
  body("username")
    .exists()
    .isString()
    .isLength({ min: 8, max: 30 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").exists().isEmail(),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
  body("firstName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("lastName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
];

const POST_Create = async (req: Request, res: Response) => {
  try {
    const { username, firstName, lastName, email, password: passwordBody } = req.body;
    if (hasErrors(req, res)) return;
    const existingUser = (await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    }).exec()) as unknown as IUser;
    if (existingUser) {
      const duplicateFields = [];
      if (username === existingUser.username) duplicateFields.push("username");
      if (email === existingUser.email) duplicateFields.push("email");
      if (existingUser.emailVerified)
        return res.status(statusCodes.conflict).json(new ErrorResponse(errorMessages.conflict, { duplicateFields }));
      else {
        await generateVerificationCode(existingUser);
        const response = {
          userInfo: existingUser,
        };
        return res.status(statusCodes.created).json(new SuccessResponse(response));
      }
    }
    const password = await bcrypt.hash(passwordBody, bcryptConfig.salt);
    const role = Role.USER;
    const newUser = (await new UserModel({
      username,
      firstName,
      lastName,
      email: email.toLowerCase(),
      role,
      password,
    }).save()) as unknown as IUser;
    await generateVerificationCode(newUser);
    newUser.password = undefined;
    const response = {
      user: newUser,
    };
    return res.status(statusCodes.created).json(new SuccessResponse(response));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
