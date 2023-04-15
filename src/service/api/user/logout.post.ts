import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/logout" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { Pusher } from "../../../singleton/pusher";
import { PushEvent } from "../../pusher/pusher";
import { PushEventList } from "../../../enum/push-events";
import OAuthModel from "../../../model/oauth";

const POST_Logout = async (_: Request, res: Response) => {
  try {
    const token = res.locals.oauth.token;
    const user = res.locals.oauth.token.user;
    await OAuthModel.revokeToken(token);
    Pusher.publish(new PushEvent(PushEventList.USER_LOGOUT, { user }));
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Logout;
