import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/invite-codes.post" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import InviteCodeModel from "../../../../model/mongo/invite-code.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { generateInviteCode } from "../../../../utils/invite-code.js";
import UserModel, { UserInterface } from "../../../../model/mongo/user.js";
import { hasErrors } from "../../../../utils/api.js";

export const POST_InviteCodesValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("count").optional().isInt().isNumeric(),
];

const POST_InviteCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:social:invite-code:write", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const targetId = req.body.target;
    const user = (await UserModel.findOne({ _id: targetId }).exec()) as unknown as UserInterface;
    if (!user) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidTarget));
      return;
    }
    const inviteCodeCount = parseInt(req.body.count) || Configuration.get("user.account-creation.invites-per-person");
    if (inviteCodeCount > Configuration.get("invite-only.code-generation.max-limit-per-request")) {
      res
        .status(statusCodes.clientInputError)
        .json(new ErrorResponse(errorMessages.generationTargetExceededForRequest));
      return;
    }
    const inviteCodes = [];
    for (let j = 0; j < inviteCodeCount; j++) {
      inviteCodes.push({
        code: generateInviteCode(),
        sourceId: targetId,
      });
    }
    await InviteCodeModel.insertMany(inviteCodes);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_InviteCodes;
