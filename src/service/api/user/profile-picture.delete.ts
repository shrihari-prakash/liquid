import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/unfollow" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";
import { S3 } from "../../../singleton/s3";
import { profilePicturePath } from "./profile-picture.patch";

const DELETE_ProfilePicture = async (req: Request, res: Response) => {
  try {
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
