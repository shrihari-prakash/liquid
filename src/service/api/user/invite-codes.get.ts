import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/invite-codes" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import InviteCodeModel from "../../../model/mongo/invite-code";

const GET_InviteCodes = async (_: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    let inviteCodes = await InviteCodeModel.find({ sourceId: userId }, { sourceId: 0, __v: 0, _id: 0 }).lean().exec();
    res.status(statusCodes.success).json(new SuccessResponse({ inviteCodes }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_InviteCodes;
