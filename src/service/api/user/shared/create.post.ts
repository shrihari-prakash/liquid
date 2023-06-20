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
import {
  getEmailValidator,
  getFirstNameValidator,
  getLastNameValidator,
  getPasswordValidator,
  getPhoneCountryCodeValidator,
  getPhoneValidator,
  getUsernameValidator,
} from "../../../../utils/validator/user";
import { MongoDB } from "../../../../singleton/mongo-db";
import { sanitizeEmailAddress } from "../../../../utils/email";

export const POST_CreateValidator = [
  body().isArray(),
  getUsernameValidator(body, true, true),
  getPasswordValidator(body, true, true),
  getEmailValidator(body, true, true),
  getFirstNameValidator(body, true, true),
  getLastNameValidator(body, true, true),
  getPhoneCountryCodeValidator(body, false, true),
  getPhoneValidator(body, false, true),
  body("*.role").optional().isString().isLength({ min: 3, max: 32 }),
];

const POST_Create = async (req: Request, res: Response) => {
  let session = "";
  try {
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    if (hasErrors(req, res)) return;
    const sourceList = req.body;
    const existingUsers = await UserModel.find({
      $or: [
        {
          email: { $in: sourceList.map((u: any) => sanitizeEmailAddress(u.email)) },
        },
        {
          username: { $in: sourceList.map((u: any) => u.username) },
        },
      ],
    }).lean();
    log.debug("Found %d duplicate users in bulk create", existingUsers.length);
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
        creationIp: req.ip
      };
      if (phone) {
        user.phone = phone;
        user.phoneCountryCode = phoneCountryCode;
        user.phoneVerified = true;
      }
      insertList[i] = user;
    }
    if (sessionOptions) {
      await UserModel.insertMany(insertList, sessionOptions);
    } else {
      await UserModel.insertMany(insertList);
    }
    await MongoDB.commitTransaction(session);
    log.info(`${insertList.length} records inserted.`);
    return res.status(statusCodes.created).json(new SuccessResponse({ insertedCount: insertList.length }));
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
