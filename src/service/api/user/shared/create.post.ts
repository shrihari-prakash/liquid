import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/create.post" });

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { body } from "express-validator";

import UserModel from "../../../../model/mongo/user.js";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { hasErrors } from "../../../../utils/api.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { bcryptConfig } from "../create.post.js";
import { MongoDB } from "../../../../singleton/mongo-db.js";
import { sanitizeEmailAddress } from "../../../../utils/email.js";
import InviteCodeModel from "../../../../model/mongo/invite-code.js";
import { generateInviteCode } from "../../../../utils/invite-code.js";
import { isRoleRankHigher } from "../../../../utils/role.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import UserValidator from "../../../../validator/user.js";

const userValidator = new UserValidator(body);

export const POST_CreateValidator = [
  body().isArray(),
  userValidator.username(true, true),
  userValidator.password(true, true),
  userValidator.email(true, true),
  userValidator.firstName(true, true),
  userValidator.lastName(true, true),
  userValidator.phoneCountryCode(false, true),
  userValidator.phone(false, true),
  body("*.role").optional().isString().isLength({ min: 3, max: 32 }),
];

const POST_Create = async (req: Request, res: Response): Promise<void> => {
  let session = "";
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:create:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    session = await MongoDB.startSession();
    MongoDB.startTransaction(session);
    const sessionOptions = MongoDB.getSessionOptions(session);
    const sourceList = req.body;
    const existingUsers = await UserModel.find({
      $or: [
        {
          email: { $in: sourceList.map((u: any) => sanitizeEmailAddress(u.email)) },
        },
        {
          username: { $in: sourceList.map((u: any) => u.username.toLowerCase()) },
        },
      ],
    }).lean();
    log.debug("Found %d duplicate users in bulk create", existingUsers.length);
    if (existingUsers.length) {
      await MongoDB.abortTransaction(session);
      res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError, { existingUsers }));
      return;
    }
    log.debug("Bulk create started. Assembling %s records.", sourceList.length);
    const insertList: any[] = [];
    const credits = Configuration.get("user.account-creation.initial-credit-count");
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
      const currentUserRole = res.locals.user.role;
      // Do not allow creation of users with more powerful roles.
      if (!isRoleRankHigher(currentUserRole, role)) {
        log.debug("Blocked account creation for role %s. Current user role: %s", role, currentUserRole);
        res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.insufficientPrivileges));
        return;
      }
      const user: any = {
        username: username.toLowerCase(),
        firstName,
        lastName,
        email: email,
        sanitizedEmail: sanitizeEmailAddress(email),
        role,
        password,
        credits,
        emailVerified: true,
        creationIp: req.ip,
      };
      if (phone) {
        user.phone = phone;
        user.phoneCountryCode = phoneCountryCode;
        user.phoneVerified = true;
      }
      insertList[i] = user;
      if (i === 0 || i % 100 === 0) {
        log.debug("Assembled %s records.", i);
      }
    }
    log.debug("Assembled %s records. Inserting to database.", insertList.length);
    let inserted;
    if (sessionOptions) {
      inserted = await UserModel.insertMany(insertList, sessionOptions);
    } else {
      inserted = await UserModel.insertMany(insertList);
    }
    if (Configuration.get("user.account-creation.enable-invite-only")) {
      let inviteCodes: any[] = [];
      const inviteCodeCount = Configuration.get("user.account-creation.invites-per-person");
      for (let i = 0; i < inserted.length; i++) {
        const user = inserted[i];
        for (let j = 0; j < inviteCodeCount; j++) {
          inviteCodes.push({
            code: generateInviteCode(),
            sourceId: user._id,
          });
        }
      }
      if (sessionOptions) {
        await InviteCodeModel.insertMany(inviteCodes, sessionOptions);
      } else {
        await InviteCodeModel.insertMany(inviteCodes);
      }
    }
    await MongoDB.commitTransaction(session);
    log.info(`${insertList.length} records inserted.`);
    res.status(statusCodes.created).json(new SuccessResponse({ insertedCount: insertList.length }));
  } catch (err) {
    log.error(err);
    await MongoDB.abortTransaction(session);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Create;

