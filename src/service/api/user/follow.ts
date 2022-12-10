import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/follow" });

import { Request, Response } from "express";
import { mongo } from "mongoose";
import { body, validationResult } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import FollowModel from "../../../model/mongo/follow";

export const FollowValidator = [
  body("target").exists().isString().isLength({ min: 8, max: 64 }),
];

const Follow = async (req: Request, res: Response) => {
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
    let bulk = FollowModel.collection.initializeUnorderedBulkOp();
    bulk
      .find({ user: new mongo.ObjectId(sourceId) })
      .upsert()
      .updateOne({
        $addToSet: {
          following: new mongo.ObjectId(targetId),
        },
      });
    bulk
      .find({ user: new mongo.ObjectId(targetId) })
      .upsert()
      .updateOne({
        $addToSet: {
          followers: new mongo.ObjectId(sourceId),
        },
      });
    await bulk.execute();
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res
      .status(statusCodes.internalError)
      .json(new ErrorResponse(errorMessages.internalError));
  }
};

export default Follow;
