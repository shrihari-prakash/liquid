import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client-api/get-user-info" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";

const POST_Banned = async (req: Request, res: Response) => {
  try {
    const target = req.body.target;
    const state = req.body.state;
    await UserModel.updateOne({ _id: target }, { $set: { isBanned: state } });
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Banned;
