import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/core/create" });

import { Request, Response } from "express";

import { UserInterface } from "../../../../model/mongo/user.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse } from "../../../../utils/response.js";
import InviteCodeModel from "../../../../model/mongo/invite-code.js";
import { ClientSession } from "mongoose";
import { generateInviteCode } from "../../../../utils/invite-code.js";

export async function validateInviteCode(req: Request, res: Response, user: UserInterface) {
  if (!Configuration.get("user.account-creation.enable-invite-only")) {
    return true;
  }
  if (!req.body.inviteCode) {
    const errors = [
      {
        msg: "Invalid value",
        param: "inviteCode",
        location: "body",
      },
    ];
    res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError, { errors }));
    return false;
  }
  const inviteCode = await InviteCodeModel.findOne({ code: req.body.inviteCode });
  if (!inviteCode || inviteCode.targetId) {
    res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidInviteCode));
    return false;
  }
  user.invitedBy = inviteCode.sourceId.toString();
  return true;
}

export async function useInviteCode(
  user: UserInterface,
  code: string,
  sessionOptions: { session: ClientSession } | undefined,
) {
  createInviteCodes(user, sessionOptions);
  if (Configuration.get("user.account-creation.enable-invite-only")) {
    const updateUsedBy = InviteCodeModel.updateOne({ code: code }, { $set: { targetId: user._id } });
    if (sessionOptions) updateUsedBy.session(sessionOptions.session);
    await updateUsedBy;
  }
}

export const createInviteCodes = async (
  user: UserInterface,
  sessionOptions: { session: ClientSession } | undefined,
) => {
  if (
    Configuration.get("user.account-creation.enable-invite-only") ||
    Configuration.get("user.account-creation.force-generate-invite-codes")
  ) {
    const inviteCodeCount = Configuration.get("user.account-creation.invites-per-person");
    const inviteCodes = [];
    for (let j = 0; j < inviteCodeCount; j++) {
      inviteCodes.push({
        code: generateInviteCode(),
        sourceId: user._id,
      });
    }
    if (sessionOptions) {
      await InviteCodeModel.insertMany(inviteCodes, sessionOptions);
    } else {
      await InviteCodeModel.insertMany(inviteCodes);
    }
    log.debug("Invite codes generated for user %s", user.username);
  }
};

