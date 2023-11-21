import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/invite-codes.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import InviteCodeModel from "../../../../model/mongo/invite-code";
import { ScopeManager } from "../../../../singleton/scope-manager";
import { hasErrors } from "../../../../utils/api";

export const GET_InviteCodesValidator = [
  query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)
];

const GET_InviteCodes = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:social:invite-code:read", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const targetId = req.body.target;
    let inviteCodes = await InviteCodeModel.find({ sourceId: targetId }, { sourceId: 0, __v: 0, _id: 0 }).lean().exec();
    res.status(statusCodes.success).json(new SuccessResponse({ inviteCodes }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_InviteCodes;
