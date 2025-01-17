import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/invite-codes.get" });

import { Request, Response } from "express";
import { query } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import InviteCodeModel from "../../../../model/mongo/invite-code.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { hasErrors } from "../../../../utils/api.js";

export const GET_InviteCodesValidator = [
  query("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)
];

const GET_InviteCodes = async (req: Request, res: Response): Promise<void> => {
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
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_InviteCodes;
