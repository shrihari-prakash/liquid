import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "admin-api/user/create" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";

import UserModel from "../../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { hasErrors } from "../../../../utils/api";
import { Configuration } from "../../../../singleton/configuration";
import { bcryptConfig } from "../create.post";

export const POST_CreateValidator = [
  body().isArray(),
  body("*.username")
    .exists()
    .isString()
    .isLength({ min: 8, max: 30 })
    .matches(/^[a-z_][a-z0-9._]*$/i),
  body("*.email").exists().isEmail(),
  body("*.password").exists().isString().isLength({ min: 8, max: 128 }),
  body("*.firstName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("*.lastName").exists().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("*.role").optional().isString().isAlpha().isLength({ min: 3, max: 32 }),
  body("*.phoneCountryCode")
    .optional()
    .isString()
    .isLength({ min: 2, max: 6 })
    .matches(/^(\+?\d{1,3}|\d{1,4})$/gm),
  body("*.phone").optional().isString().isLength({ min: 10, max: 12 }),
];

const POST_Create = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const sourceList = req.body;
    const existingUsers = await UserModel.find({
      $or: [
        {
          email: { $in: sourceList.map((u: any) => u.email) },
        },
        {
          username: { $in: sourceList.map((u: any) => u.username) },
        },
      ],
    }).lean();
    if (existingUsers.length) {
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { existingUsers }));
    }
    const insertList: any[] = [];
    for (let i = 0; i < sourceList.length; i++) {
      const {
        username,
        firstName,
        lastName,
        email,
        role: roleBody,
        password: passwordBody,
        phone,
        phoneCountryCode,
      } = sourceList[i];
      const password = await bcrypt.hash(passwordBody, bcryptConfig.salt);
      const role = roleBody || Configuration.get("system.role.default");
      const user: any = {
        username,
        firstName,
        lastName,
        email: email.toLowerCase(),
        role,
        password,
        emailVerified: true,
      };
      if (phone) {
        user.phone = phone;
        user.phoneCountryCode = phoneCountryCode;
        user.phoneVerified = true;
      }
      insertList[i] = user;
    }
    await UserModel.insertMany(insertList);
    log.info(`${insertList.length} records inserted.`);
    return res.status(statusCodes.created).json(new SuccessResponse({ insertedCount: insertList.length }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
