import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/credits" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel from "../../../../model/mongo/user";
import { hasErrors } from "../../../../utils/api";
import { flushUserInfoFromRedis } from "../../../../model/oauth";

const Operations = {
  INCREMENT: "increment",
  DECREMENT: "decrement",
  SET: "set",
};

export const POST_CreditsValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 128 }),
  body("type").exists().isString().isIn([Operations.INCREMENT, Operations.DECREMENT, Operations.SET]),
  body("value").exists().isInt({ min: 0 }),
];

const POST_Credits = async (req: Request, res: Response) => {
  if (hasErrors(req, res)) return;
  try {
    const query: any = {};
    const target = req.body.target;
    let value;
    switch (req.body.type) {
      case Operations.INCREMENT:
        value = req.body.value;
        query.$inc = { credits: value };
        break;
      case Operations.DECREMENT:
        value = req.body.value;
        query.$inc = { credits: -value };
        break;
      case Operations.SET:
        value = req.body.value;
        query.$set = { credits: value };
    }
    await UserModel.findByIdAndUpdate(target, query);
    res.status(statusCodes.success).json(new SuccessResponse());
    flushUserInfoFromRedis(target);
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Credits;
