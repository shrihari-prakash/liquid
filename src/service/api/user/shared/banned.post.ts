import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client-api/get-user-info" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { body } from "express-validator";
import { hasErrors } from "../../../../utils/api";

export const POST_BannedValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("state").exists().isBoolean(),
];

const POST_Banned = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  try {
    const target = req.body.target;
    const state = req.body.state;
    await UserModel.updateOne({ _id: target }, { $set: { isBanned: state } });
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Banned;
