import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/logout.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import GET_Logout from "./logout.get";
import UserModel from "../../../model/mongo/user";
import { flushUserInfoFromRedis } from "../../../model/oauth";

const GET_LogoutAll = async (req: Request, res: Response) => {
  try {
    if (!res.locals.oauth) {
      res.status(statusCodes.success).json(new SuccessResponse());
      return;
    }
    const userId = res.locals.oauth.token.user._id;
    await UserModel.updateOne({ _id: userId }, { $set: { globalLogoutAt: new Date().toISOString() } });
    await GET_Logout(req, res);
    flushUserInfoFromRedis([userId]);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_LogoutAll;
