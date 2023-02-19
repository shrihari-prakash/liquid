import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/me" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";
import { Configuration } from "../../../singleton/configuration";

const GET_Me = async (_: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    const user = await UserModel.findOne({ _id: userId }).exec();
    const editableFields = Configuration.get("user.profile.editable-fields");
    res.status(statusCodes.success).json(new SuccessResponse({ user, editableFields }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Me;
