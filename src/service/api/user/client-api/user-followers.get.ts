import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/user-followers" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { useFollowersQuery } from "../../../../model/query/followers";
import { body } from "express-validator";
import { Configuration } from "../../../../singleton/configuration";

export const GET_UserFollowersValidator = [body("target").exists().isString().isLength({ min: 8, max: 128 })];

const GET_UserFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.query.target as string;
    let limit: any = parseInt(req.query.limit as string);
    const offset = req.query.offset as string;
    if (!limit) {
      limit = Configuration.get("pagination.default-limit");
    }
    if (limit > Configuration.get("pagination.max-limit")) {
      limit = Configuration.get("pagination.max-limit");
    }
    const query = useFollowersQuery(userId, limit);
    if (offset) {
      query[0].$match.$and.push({ createdAt: { $lt: new Date(offset) } });
    }
    FollowModel.aggregate(query).exec(function (up, records) {
      if (up) {
        throw up;
      }
      res.status(statusCodes.success).json(new SuccessResponse({ records }));
    });
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserFollowers;
