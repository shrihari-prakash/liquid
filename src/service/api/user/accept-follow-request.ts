import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/accept-follow-request" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { updateFollowCount } from "../../../utils/follow";
import { validateErrors } from "../../../utils/api";

export const AcceptFollowRequestValidator = [
  body("request").exists().isString().isLength({ min: 8, max: 64 }),
];

const AcceptFollowRequest = async (req: Request, res: Response) => {
  try {
    validateErrors(req, res);
    const targetId = res.locals.oauth.token.user._id;
    const requestId = req.body.request;
    const query: any = {
      $and: [{ _id: requestId }, { targetId }],
    };
    const requestObject = (await FollowModel.findOneAndUpdate(query, {
      approved: true,
    })) as any;
    await updateFollowCount(requestObject.sourceId, targetId, 1);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default AcceptFollowRequest;
