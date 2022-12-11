import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { body, validationResult } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import UserModel from "../../../model/mongo/user";

export const SwitchPrivateValidator = [body("state").exists().isBoolean()];

const SwitchPrivate = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          fields: errors.array({ onlyFirstError: true }),
        })
      );
    }
    const userId = res.locals.oauth.token.user._id;
    const state = req.body.state;
    await UserModel.updateOne({ _id: userId }, { $set: { isPrivate: state } });
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default SwitchPrivate;
