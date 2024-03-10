import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/profile-picture.delete" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel from "../../../model/mongo/user.js";
import { S3 } from "../../../singleton/s3.js";
import { profilePicturePath } from "./profile-picture.patch.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";

const DELETE_ProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:write", res)) {
      return;
    };
    const userId = req.res?.locals.oauth.token.user._id;
    const fileName = `${profilePicturePath}/${userId}.png`;
    await S3.delete(fileName);
    await UserModel.updateOne({ _id: userId }, { $set: { profilePicturePath: null } }).exec();
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default DELETE_ProfilePicture;
