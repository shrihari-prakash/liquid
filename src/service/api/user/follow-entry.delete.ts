import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/delete-follow-request" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { hasErrors } from "../../../utils/api";
import { updateFollowCount } from "../../../utils/follow";

export const DELETE_FollowEntryValidator = [body("target").exists().isString().isLength({ min: 8, max: 64 })];

const DELETE_FollowEntry = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const userId = res.locals.oauth.token.user._id;
    const entryId = req.body.target;
    const query: any = { $and: [{ _id: entryId }] };
    const requestObject = (await FollowModel.findOne(query)) as any;
    if (!requestObject.sourceId.equals(userId) && !requestObject.targetId.equals(userId)) {
      res.status(statusCodes.unauthorized).json(new ErrorResponse(errorMessages.unauthorized));
      return;
    }
    await FollowModel.deleteOne(requestObject._id);
    if (requestObject.approved) {
      await updateFollowCount(requestObject.sourceId, requestObject.targetId, -1);
    }
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default DELETE_FollowEntry;
