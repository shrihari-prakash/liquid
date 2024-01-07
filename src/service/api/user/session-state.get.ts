import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/session-state.get" });

import { Request, Response } from "express";
import moment from "moment";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";

const GET_SessionState = async (req: Request, res: Response) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
    }
    const user = await await UserModel.findById(sessionUser._id).lean();
    if (user) {
      const globalLogoutAt = user.globalLogoutAt;
      const currentLoginAt = req.session.loggedInAt;
      if (globalLogoutAt && moment(globalLogoutAt).isAfter(moment(currentLoginAt))) {
        log.debug("Expired session detected.");
        req.session.destroy(() => {});
        return null;
      }
      return res.status(statusCodes.success).json(new SuccessResponse({ userInfo: user }));
    } else {
      return res.status(statusCodes.forbidden).json(new ErrorResponse(errorMessages.forbidden));
    }
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_SessionState;
