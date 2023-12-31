import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/user-info.get" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { UserAdminProjection, UserClientProjection, UserInterface } from "../../../../model/mongo/user";
import { Configuration } from "../../../../singleton/configuration";
import { checkSubscription } from "../../../../utils/subscription";
import { attachProfilePicture } from "../../../../utils/profile-picture";
import { ScopeManager } from "../../../../singleton/scope-manager";

export const GET_UserInfoValidator = [query("targets").exists().isString()];

const GET_UserInfo = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:read", res)) {
      return;
    }
    const targets = (req.query.targets as string).split(",");
    const isClient = res.locals.user.isClient;
    if (targets.length > (Configuration.get("get-user-max-items") as number)) {
      return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
    }
    const users = (await UserModel.find(
      {
        _id: { $in: targets },
      },
      isClient ? UserClientProjection : UserAdminProjection
    )
      .lean()
      .exec()) as unknown as UserInterface[];
    checkSubscription(users);
    await attachProfilePicture(users);
    res.status(statusCodes.success).json(new SuccessResponse({ users }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_UserInfo;
