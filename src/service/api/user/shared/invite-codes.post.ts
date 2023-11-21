import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/invite-codes.post" });

import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import InviteCodeModel from "../../../../model/mongo/invite-code";
import { Configuration } from "../../../../singleton/configuration";
import { ScopeManager } from "../../../../singleton/scope-manager";
import { generateInviteCode } from "../../../../utils/invite-code";
import UserModel, { UserInterface } from "../../../../model/mongo/user";
import { hasErrors } from "../../../../utils/api";

export const POST_InviteCodesValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
  body("count").optional().isInt().isNumeric(),
];

const POST_InviteCodes = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:social:invite-code:write", res)) {
      return;
    };
    if (hasErrors(req, res)) return;
    const targetId = req.body.target;
    const user = (await UserModel.findOne({ _id: targetId }).exec()) as unknown as UserInterface;
    if (!user) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidTarget));
    }
    const inviteCodeCount = parseInt(req.body.count) || Configuration.get("user.account-creation.invites-per-person");
    if (inviteCodeCount > Configuration.get("invite-only.code-generation.max-limit-per-request")) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.generationTargetExceededForRequest));
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
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_InviteCodes;
