import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/logout" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { Pusher } from "../../../singleton/pusher";
import { PushEvent } from "../../pusher/pusher";
import { PushEventList } from "../../../enum/push-events";
import OAuthModel from "../../../model/oauth";
import { Redis } from "../../../singleton/redis";
import { Configuration } from "../../../singleton/configuration";

const POST_Logout = async (req: Request, res: Response) => {
  try {
    const token = res.locals?.oauth?.token;
    const user = token ? { ...res.locals.oauth.token.user } : null;
    if (token) {
      await OAuthModel.revokeToken(token);
    }
    const sessionId = req.session?.id;
    if (sessionId && Configuration.get("privilege.can-use-cache")) {
      await Redis.client.del(`session_id:${sessionId}`);
      log.debug("Deleted session id %s from Redis.", sessionId);
    }
    if (req.session && req.session.destroy) {
      req.session.destroy(() => null);
      // @ts-ignore
      delete req.session;
    }
    if (user) {
      Pusher.publish(new PushEvent(PushEventList.USER_LOGOUT, { user }));
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Logout;
