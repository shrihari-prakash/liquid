import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/session-state.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel from "../../../model/mongo/user.js";
import { isTokenInvalidated } from "../../../utils/session.js";

const GET_SessionState = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
      return;
    }
    const user = await await UserModel.findById(sessionUser._id).lean();
    if (user) {
      const globalLogoutAt = user.globalLogoutAt as unknown as string;
      const currentLoginAt = req.session.loggedInAt as string;
      if (isTokenInvalidated(globalLogoutAt, currentLoginAt)) {
        log.debug("Expired session detected.");
        req.session.destroy(() => {});
        return;
      }
      res.status(statusCodes.success).json(new SuccessResponse({ userInfo: user }));
    } else {
      res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
    }
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_SessionState;
