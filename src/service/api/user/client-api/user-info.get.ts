import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client-api/get-user-info" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { IUser } from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";

const GET_UserInfo = async (req: Request, res: Response) => {
  try {
    const targets = (req.query.targets as string).split(",");
    if (targets.length > (Configuration.get("get-user-max-items") as number)) {
      return res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.clientInputError));
    }
    const users = (await UserModel.find({
      _id: { $in: targets },
    }).exec()) as unknown as IUser[];
    res.status(statusCodes.success).json(new SuccessResponse({ users }));
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserInfo;
