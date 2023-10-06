import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client-api/follow-status" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import FollowModel from "../../../../model/mongo/follow";
import { UserInterface } from "../../../../model/mongo/user";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const GET_FollowStatusValidator = [
  query("source").exists().isString().isLength({ max: 128 }).custom(isValidObjectId),
  query("target").exists().isString().isLength({ max: 128 }).custom(isValidObjectId),
];

const GET_FollowStatus = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("client:social:follow:read", res)) {
      return;
    };
    const sourceId = req.query.source as string;
    const targetId = req.query.target as string;
    const isFollowing = (await FollowModel.findOne({
      $and: [{ targetId }, { sourceId }, { approved: true }],
    }).exec()) as unknown as UserInterface;
    res.status(statusCodes.success).json(new SuccessResponse({ following: isFollowing ? true : false }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_FollowStatus;
