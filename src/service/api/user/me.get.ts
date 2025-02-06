import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/me.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import UserModel, { UserInterface } from "../../../model/mongo/user.js";
import { Configuration } from "../../../singleton/configuration.js";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { hydrateUserProfile } from "../../../utils/user.js";

const GET_Me = async (_: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("delegated:profile:read", res)) {
      return;
    }
    const userId = res.locals.oauth.token.user._id;
    let user = (await UserModel.findOne({ _id: userId }).lean().exec()) as unknown as UserInterface;
    const editableFields = Configuration.get("user.profile.editable-fields");
    await hydrateUserProfile(user, { selfRetrieve: true });
    res.status(statusCodes.success).json(new SuccessResponse({ user, editableFields }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Me;

