import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/create" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";
import moment from "moment";

import UserModel, { UserInterface } from "../../../model/mongo/user";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { hasErrors } from "../../../utils/api";
import { Pusher } from "../../../singleton/pusher";
import { PushEvent } from "../../pusher/pusher";
import { PushEventList } from "../../../enum/push-events";
import { Configuration } from "../../../singleton/configuration";
import { sanitizeEmailAddress } from "../../../utils/email";
import InviteCodeModel from "../../../model/mongo/invite-code";
import { MongoDB } from "../../../singleton/mongo-db";
import { ClientSession } from "mongoose";
import { generateInviteCode } from "../../../utils/invite-code";
import UserValidator from "../../../validator/user";
import { Mailer } from "../../../singleton/mailer";
import { VerificationCodeType } from "../../../enum/verification-code";

export const bcryptConfig = {
  salt: 10,
};

const userValidator = new UserValidator(body);

export const POST_CreateValidator = [
  userValidator.username(true),
  userValidator.password(true),
  userValidator.email(true),
  userValidator.firstName(true),
  userValidator.lastName(true),
  userValidator.phoneCountryCode(),
  userValidator.phone(),
  body("inviteCode").optional().isString(),
];

async function validateInviteCode(req: Request, res: Response, user: UserInterface) {
  if (!Configuration.get("user.account-creation.enable-invite-only")) {
    return true;
  }
  if (!req.body.inviteCode) {
    const errors = [
      {
        msg: "Invalid value",
        param: "inviteCode",
        location: "body",
      },
    ];
    res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    return false;
  }
  const inviteCode = await InviteCodeModel.findOne({ code: req.body.inviteCode });
  if (!inviteCode || inviteCode.targetId) {
    res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidInviteCode));
    return false;
  }
  user.invitedBy = inviteCode.sourceId.toString();
  return true;
}

async function useInviteCode(
  user: UserInterface,
  code: string,
  sessionOptions: { session: ClientSession } | undefined
) {
  if (
    Configuration.get("user.account-creation.enable-invite-only") ||
    Configuration.get("user.account-creation.force-generate-invite-codes")
  ) {
    const inviteCodeCount = Configuration.get("user.account-creation.invites-per-person");
    const inviteCodes = [];
    for (let j = 0; j < inviteCodeCount; j++) {
      inviteCodes.push({
        code: generateInviteCode(),
        sourceId: user._id,
      });
    }
    if (sessionOptions) {
      await InviteCodeModel.insertMany(inviteCodes, sessionOptions);
    } else {
      await InviteCodeModel.insertMany(inviteCodes);
    }
    log.debug("Invite codes generated for user %s", user.username);
  }
  if (Configuration.get("user.account-creation.enable-invite-only")) {
    const updateUsedBy = InviteCodeModel.updateOne({ code: code }, { $set: { targetId: user._id } });
    if (sessionOptions) updateUsedBy.session(sessionOptions.session);
    await updateUsedBy;
  }
}

const POST_Create = async (req: Request, res: Response) => {
  let session = "";
  try {
    if (Configuration.get("user.account-creation.enable-ip-based-throttle")) {
      const ipResult = (await UserModel.findOne({ creationIp: req.ip })
        .sort({ $natural: -1 })
        .exec()) as unknown as UserInterface;
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
    }).exec()) as unknown as UserInterface;
    if (existingUser) {
      const duplicateFields = [];
      if (username === existingUser.username) duplicateFields.push("username");
      if (email === existingUser.email) duplicateFields.push("email");
      if (existingUser.emailVerified)
        return res.status(statusCodes.conflict).json(new ErrorResponse(errorMessages.conflict, { duplicateFields }));
      else {
        await Mailer.generateAndSendEmailVerification(existingUser, VerificationCodeType.SIGNUP);
        const response = {
          user: existingUser,
        };
        return res.status(statusCodes.created).json(new SuccessResponse(response));
      }
    }
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const password = await bcrypt.hash(passwordBody, bcryptConfig.salt);
    const role = Configuration.get("system.role.default");
    const credits = Configuration.get("user.account-creation.initial-credit-count");
    const toInsert: any = {
      username,
      firstName,
      lastName,
      email: sanitizeEmailAddress(email),
      role,
      password,
      credits,
      scope: Configuration.get("user.account-creation.default-scope"),
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
    const isInviteCodeValid = await validateInviteCode(req, res, toInsert);
    if (!isInviteCodeValid) {
      await MongoDB.abortTransaction(session);
      return;
    }
    const newUser = (await new UserModel(toInsert).save(sessionOptions)) as unknown as UserInterface;
    if (shouldVerifyEmail) {
      await Mailer.generateAndSendEmailVerification(newUser, VerificationCodeType.SIGNUP);
    }
    await useInviteCode(newUser, req.body.inviteCode, sessionOptions);
    newUser.password = undefined;
    const response = {
      user: newUser,
    };
    await MongoDB.commitTransaction(session);
    Pusher.publish(new PushEvent(PushEventList.USER_CREATE, { user: newUser }));
    return res.status(statusCodes.created).json(new SuccessResponse(response));
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;
