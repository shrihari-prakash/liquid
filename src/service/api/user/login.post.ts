import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/login.post" });

import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { body } from "express-validator";

import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { hasErrors } from "../../../utils/api.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import { sanitizeEmailAddress } from "../../../utils/email.js";
import UserValidator from "../../../validator/user.js";
import { Mailer } from "../../../singleton/mailer.js";
import { VerificationCodeType } from "../../../enum/verification-code.js";
import { Configuration } from "../../../singleton/configuration.js";
import LoginHistoryModel, { LoginHistoryInterface } from "../../../model/mongo/login-history.js";
import { isEmail2FA } from "../../../utils/2fa.js";
import { LoginFailure } from "../../../enum/login-failure.js";

const userValidator = new UserValidator(body);

export const POST_LoginValidator = [
  userValidator.username(),
  userValidator.email(),
  userValidator.password(true),
  body("userAgent")
    .if(() => Configuration.get("user.login.require-user-agent"))
    .exists()
    .isString()
    .isLength({ max: 1024 }),
];

const POST_Login = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const { username, email, password } = req.body;
    const select = ["+password"];
    const query: any = {};
    if (email) {
      query.email = sanitizeEmailAddress(email);
    } else {
      query.username = username.toLowerCase();
    }
    const user = (await UserModel.findOne(query, select).exec()) as unknown as UserInterface;
    if (!user || !user.password)
      return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    if (!user.emailVerified)
      return res.status(statusCodes.resourceNotActive).json(new ErrorResponse(errorMessages.resourceNotActive));
    let loginMeta: LoginHistoryInterface = {
      targetId: user._id,
      userAgent: req.body.userAgent,
      source: "password",
      ipAddress: req.ip,
    };
    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      loginMeta = { ...loginMeta, success: false, reason: LoginFailure.PASSWORD_REJECTED };
      if (Configuration.get("user.login.record-failed-attempts")) {
        await new LoginHistoryModel(loginMeta).save();
        log.debug("Login history saved %o.", loginMeta);
      }
      return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
    }
    loginMeta = { ...loginMeta, success: true };
    log.debug("Login metadata %o", loginMeta);
    if (isEmail2FA(user)) {
      const code = await Mailer.generateAndSendEmailVerification(user, VerificationCodeType.LOGIN);
      req.session.loginMeta = loginMeta;
      const userInfo = {
        _id: user._id,
        username: user.username,
        email: user.email,
      };
      const sessionHash = code.sessionHash;
      req.session.save(function (err) {
        log.info("Login meta written to session for user %s.", user._id);
        if (err) {
          log.error(err);
          return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
        }
        return res.status(statusCodes.success).json(new SuccessResponse({ "2faEnabled": true, sessionHash, userInfo }));
      });
    } else {
      user.password = undefined;
      req.session.user = user;
      req.session.loggedInAt = new Date().toISOString();
      log.debug("Assigned session id %s for user %s", req.session?.id, user._id);
      Pusher.publish(new PushEvent(PushEventList.USER_LOGIN, { user }));
      if (Configuration.get("user.login.record-successful-attempts")) {
        await new LoginHistoryModel(loginMeta).save();
        log.debug("Login history saved %o.", loginMeta);
      }
      req.session.save(function (err) {
        if (err) {
          log.error(err);
          return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
        }
        return res.status(statusCodes.success).json(new SuccessResponse({ "2faEnabled": false, userInfo: user }));
      });
    }
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Login;

