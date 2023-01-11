import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import UserModel, { IUser } from "../../../model/mongo/user";
import { updateFollowCount } from "../../../utils/follow";
import { validateErrors } from "../../../utils/api";

export const POST_FollowValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 64 }),
];

function sendSuccess(res: Response, status: string) {
  res.status(statusCodes.success).json(new SuccessResponse({ status }));
}

const POST_Follow = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    const query: any = {
      targetId,
      sourceId,
    };
    const target = (await UserModel.findOne({
      _id: targetId,
    }).exec()) as unknown as IUser;
    if (target.isPrivate) {
      query.approved = false;
      await new FollowModel(query).save();
      sendSuccess(res, "requested");
    } else {
      await new FollowModel(query).save();
      await updateFollowCount(sourceId, targetId, 1);
      sendSuccess(res, "followed");
    }
  } catch (err: any) {
    if (err.message.includes("E11000")) {
      sendSuccess(res, "duplicate");
    }
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_Follow;
