import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/create" });

import { Request, Response } from "express";
import sgMail from "@sendgrid/mail";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

import app from "../../..";
import UserModel, { IUser } from "../../../model/mongo/user";
import verificationCodeModel from "../../../model/mongo/verification-code";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import Role from "../../../enum/role";
import { Configuration } from "../../../singleton/configuration";

const bcryptConfig = {
  salt: 10,
};

const generateVerificationCode = async function (user: IUser) {
  await verificationCodeModel.deleteMany({ belongsTo: user._id });
  const code = {
    belongsTo: user._id,
    verificationMethod: "email",
    code: require("crypto").randomBytes(18).toString("hex"),
  };
  await new verificationCodeModel(code).save();
  const appName = Configuration.get("appName") as string;
  const msg = {
    to: user.email,
    from: {
      email: Configuration.get("appOutboundEmailAddress") as string,
      name: appName,
    },
    subject: "Verify your account",
    text: `Here's your ${appName} verification code: ${code.code}`,
    html: `Here's your ${appName} verification code: <strong>${code.code}</strong>`,
  };
  if (app.get("env") === "production") {
    await sgMail.send(msg);
  } else {
    log.info(code);
  }
  return code;
};

export const CreateValidator = [
  body("username")
    .exists()
    .isString()
    .isLength({ min: 8, max: 16 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("email").exists().isEmail(),
  body("password").exists().isString().isLength({ min: 8, max: 128 }),
  body("firstName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("lastName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
];

const Create = async (req: Request, res: Response) => {
  try {
    const {
      username,
      firstName,
      lastName,
      email,
      password: passwordBody,
    } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          fields: errors.array({ onlyFirstError: true }),
        })
      );
    }

    if (!username || !firstName || !lastName || !email || !passwordBody)
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError));

    const existingUser = (await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    }).exec()) as unknown as IUser;

    if (existingUser) {
      const duplicateFields = [];
      if (username === existingUser.username) duplicateFields.push("username");
      if (email === existingUser.email) duplicateFields.push("email");
      if (existingUser.emailVerified)
        return res
          .status(statusCodes.conflict)
          .json(new ErrorResponse(errorMessages.conflict, { duplicateFields }));
      else {
        await generateVerificationCode(existingUser);
        const response = {
          userInfo: existingUser,
        };
        return res
          .status(statusCodes.created)
          .json(new SuccessResponse(response));
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
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Create;
