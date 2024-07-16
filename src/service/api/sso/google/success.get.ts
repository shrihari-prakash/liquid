import { body } from "express-validator";
import SSOTokenModel from "../../../../model/mongo/sso-token.js";
import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "sso/google/success.get" });

import { Request, Response } from "express";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel from "../../../../model/mongo/user.js";
import { Pusher } from "../../../../singleton/pusher.js";
import { PushEvent } from "../../../pusher/pusher.js";
import { PushEventList } from "../../../../enum/push-events.js";
import { Configuration } from "../../../../singleton/configuration.js";
import LoginHistoryModel, { LoginHistoryInterface } from "../../../../model/mongo/login-history.js";
import { hasErrors } from "../../../../utils/api.js";

export const POST_GoogleSuccessValidator = [
  body("ssoToken").exists().isString().isLength({ max: 64 }),
  body("userAgent")
    .if(() => Configuration.get("user.login.require-user-agent"))
    .exists()
    .isString()
    .isLength({ max: 1024 }),
];

const POST_GoogleSuccess = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  const userId = await SSOTokenModel.findOne({ token: req.query.ssoToken }).lean();
  if (!userId) {
    log.warn("SSO token not found %s.", req.query.ssoToken);
    return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
  }
  await SSOTokenModel.deleteOne({ token: req.query.ssoToken }).exec();
  log.info("SSO token found %s.", req.query.ssoToken);
  const user = await UserModel.findById(userId.userId).lean();
  if (!user) {
    log.warn("User not found %s.", userId.userId);
    return res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
  }
  log.info("User found %s.", userId.userId);
  (user as any).password = undefined;
  req.session.user = user;
  req.session.loggedInAt = new Date().toISOString();
  log.debug("Assigned session id %s for user %s", req.session?.id, user._id);
  Pusher.publish(new PushEvent(PushEventList.USER_LOGIN, { user }));
  if (Configuration.get("user.login.record-successful-attempts")) {
    let loginMeta: LoginHistoryInterface = {
      targetId: user._id.toString(),
      userAgent: req.body.userAgent,
      ipAddress: req.ip,
      success: true,
    };
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
};

export default POST_GoogleSuccess;

