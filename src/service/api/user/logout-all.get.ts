import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/logout-all.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import GET_Logout from "./logout.get.js";
import UserModel from "../../../model/mongo/user.js";
import { Pusher } from "../../../singleton/pusher.js";
import { PushEvent } from "../../pusher/pusher.js";
import { PushEventList } from "../../../enum/push-events.js";
import { flushUserInfoFromRedis } from "../../../model/oauth/cache.js";

const GET_LogoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!res.locals.oauth) {
      res.status(statusCodes.success).json(new SuccessResponse());
      return;
    }
    const userId = res.locals.oauth.token.user._id;
    await UserModel.updateOne({ _id: userId }, { $set: { globalLogoutAt: new Date().toISOString() } });
    const user = res.locals.oauth.token.user;
    await GET_Logout(req, res);
    flushUserInfoFromRedis([userId]);
    Pusher.publish(new PushEvent(PushEventList.USER_LOGOUT_ALL, { user }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_LogoutAll;
