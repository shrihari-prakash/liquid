import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/create" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";
import moment from "moment";

import UserModel, { IUser } from "../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { hasErrors } from "../../../utils/api";
import { generateVerificationCode } from "../../../utils/verification-code/verification-code";
import { Pusher } from "../../../singleton/pusher";
import { PushEvent } from "../../pusher/pusher";
import { PushEventList } from "../../../enum/push-events";
import { Configuration } from "../../../singleton/configuration";
import { sanitizeEmailAddress } from "../../../utils/email";
import {
  getEmailValidator,
  getFirstNameValidator,
  getLastNameValidator,
  getPasswordValidator,
  getPhoneCountryCodeValidator,
  getPhoneValidator,
  getUsernameValidator,
} from "../../../utils/validator/user";

export const bcryptConfig = {
  salt: 10,
};

export const POST_CreateValidator = [
  getUsernameValidator(body, true),
  getPasswordValidator(body, true),
  getEmailValidator(body, true),
  getFirstNameValidator(body, true),
  getLastNameValidator(body, true),
  getPhoneCountryCodeValidator(body, false),
  getPhoneValidator(body, false),
];

const POST_Create = async (req: Request, res: Response) => {
  try {
    if (Configuration.get("user.account-creation.enable-ip-based-throttle")) {
      const ipResult = (await UserModel.findOne({
        creationIp: req.ip,
      }).exec()) as unknown as IUser;
      if (ipResult && ipResult.creationIp === req.ip) {
        const duration = moment.duration(moment().diff(moment(ipResult.createdAt)));
        const difference = duration.asSeconds();
        const window = Configuration.get("user.account-creation.ip-based-throttle.window-size");
        if (difference <= window) {
          log.info(
            "Duplicate account creation for ip %s throttled. %s seconds left for lifting the throttle.",
            req.ip,
            window - difference
          );
          return res.status(statusCodes.tooManyRequests).json(new ErrorResponse(errorMessages.creationThrottled));
        }
      }
    }
    const { username, firstName, lastName, email, password: passwordBody, phone, phoneCountryCode } = req.body;
    if (hasErrors(req, res)) return;
    if (Configuration.get("user.account-creation.allow-only-whitelisted-email-domains")) {
      const domain = email.replace(/.*@/, "");
      const whitelistedEmailDomains = Configuration.get("user.account-creation.whitelisted-email-domains");
      if (!whitelistedEmailDomains.includes(domain)) {
        return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.badEmailDomain));
      }
    }
    if (phone && !phoneCountryCode) {
      const errors = [
        {
          msg: "Invalid value",
          param: "phoneCountryCode",
          location: "body",
        },
      ];
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    }
    const existingUser = (await UserModel.findOne({
      $or: [{ email: sanitizeEmailAddress(email) }, { username }],
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
    const role = Configuration.get("system.role.default");
    const toInsert: any = {
      username,
      firstName,
      lastName,
      email: sanitizeEmailAddress(email),
      role,
      password,
      creationIp: req.ip,
    };
    const shouldVerifyEmail = Configuration.get("user.account-creation.require-email-verification");
    if (!shouldVerifyEmail) {
      toInsert.emailVerified = true;
    }
    if (phone && Configuration.get("privilege.can-use-phone-number")) {
      toInsert.phone = phone;
      toInsert.phoneCountryCode = phoneCountryCode;
      toInsert.phoneVerified = false;
    }
    const newUser = (await new UserModel(toInsert).save()) as unknown as IUser;
    if (shouldVerifyEmail) {
      await generateVerificationCode(newUser);
    }
    newUser.password = undefined;
    const response = {
      user: newUser,
    };
    Pusher.publish(new PushEvent(PushEventList.USER_CREATE, { user: newUser }));
    return res.status(statusCodes.created).json(new SuccessResponse(response));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
