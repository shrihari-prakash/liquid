import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/logout.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import OAuthModel from "../../../model/oauth/oauth.js";
import { Redis } from "../../../singleton/redis.js";
import { Token } from "@node-oauth/oauth2-server";

const GET_Logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = res.locals?.oauth?.token;
    const user = token ? { ...res.locals.oauth.token.user } : null;
    if (token) {
      await (OAuthModel as any).revokeToken(token as Token);
    }
    const sessionId = req.session?.id;
    if (req.session && req.session.destroy) {
      req.session.destroy(async () => {
        if (sessionId) {
          await Redis.del(`session_id:${sessionId}`);
          log.debug("Deleted session id %s from Redis.", sessionId);
        }
        if (user && (req.baseUrl + req.path).endsWith("/user/logout")) {
          Pusher.publish(new PushEvent(PushEventList.USER_LOGOUT, { user }));
        }
        res.status(statusCodes.success).json(new SuccessResponse());
      });
      // @ts-ignore
      delete req.session;
    }
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Logout;
