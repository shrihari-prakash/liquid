import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { validationResult } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";
import { updateFollowCount } from "../../../utils/follow";

const Unfollow = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          errors: errors.array(),
        })
      );
    }
    const sourceId = res.locals.oauth.token.user._id;
    const targetId = req.body.target;
    const result = await FollowModel.deleteOne({
      targetId,
      sourceId,
    });
    if (!result.deletedCount) {
      return res.status(statusCodes.success).json(new SuccessResponse());
    }
    await updateFollowCount(sourceId, targetId, -1);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Unfollow;
