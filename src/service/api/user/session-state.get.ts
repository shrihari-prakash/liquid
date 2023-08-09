import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/session-state" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";

const GET_SessionState = async (req: Request, res: Response) => {
  try {
    const user = req.session?.user;
    if (user) {
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
