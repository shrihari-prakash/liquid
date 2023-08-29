import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/invite-codes" });

import { Request, Response } from "express";
import moment from "moment";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import InviteCodeModel from "../../../model/mongo/invite-code";
import { Configuration } from "../../../singleton/configuration";
import { ScopeManager } from "../../../singleton/scope-manager";

const GET_InviteCodes = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:social:invite-code:read", res)) {
      return;
    };
    const user = res.locals.oauth.token.user;
    const durationSinceCreation = moment.duration(moment().diff(moment(user.createdAt)));
    const difference = durationSinceCreation.asSeconds();
    const window = Configuration.get("user.account-creation.invite-code-availability-window");
    if (difference <= window) {
      const waitTime = window - difference;
      log.info(
        "Hidden invite codes for account %s. %s seconds left for releasing invite codes.",
        user._id,
        waitTime
      );
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.inviteCodesHidden, { waitTime: Math.ceil(waitTime) }));
    }
    let inviteCodes = await InviteCodeModel.find({ sourceId: user._id }, { sourceId: 0, __v: 0, _id: 0 }).lean().exec();
    res.status(statusCodes.success).json(new SuccessResponse({ inviteCodes }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_InviteCodes;
