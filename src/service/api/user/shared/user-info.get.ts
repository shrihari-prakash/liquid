import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/get-user-info" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { IUser } from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";
import { checkSubscription } from "../../../../utils/subscription";
import { attachProfilePicture } from "../../../../utils/profile-picture";

export const GET_UserInfoValidator = [query("targets").exists().isString()];

const GET_UserInfo = async (req: Request, res: Response) => {
  try {
    const targets = (req.query.targets as string).split(",");
    if (targets.length > (Configuration.get("get-user-max-items") as number)) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    }
    const users = (await UserModel.find({
      _id: { $in: targets },
    })
      .lean()
      .exec()) as unknown as IUser[];
    checkSubscription(users);
    await attachProfilePicture(users);
    res.status(statusCodes.success).json(new SuccessResponse({ users }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserInfo;
