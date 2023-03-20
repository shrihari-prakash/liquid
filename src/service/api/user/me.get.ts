import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/me" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel, { IUser } from "../../../model/mongo/user";
import { Configuration } from "../../../singleton/configuration";
import { checkSubscription } from "../../../utils/subscription";
import { attachProfilePicture } from "../../../utils/profile-picture";

const GET_Me = async (_: Request, res: Response) => {
  try {
    const userId = res.locals.oauth.token.user._id;
    let user = (await UserModel.findOne({ _id: userId }).lean().exec()) as unknown as IUser;
    checkSubscription(user);
    const editableFields = Configuration.get("user.profile.editable-fields");
    await attachProfilePicture(user);
    res.status(statusCodes.success).json(new SuccessResponse({ user, editableFields }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Me;
