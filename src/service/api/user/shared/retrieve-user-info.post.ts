import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/user-info.get" });

import { Request, Response } from "express";
import { body } from "express-validator";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel, { UserAdminProjection, UserClientProjection, UserInterface } from "../../../../model/mongo/user.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { hydrateUserProfile } from "../../../../utils/user.js";

export const POST_RetrieveUserInfoValidator = [
  body("targets").exists().isArray(),
  body("targets.*").isString(),
  body("field").optional().isIn(["_id", "email", "sanitizedEmail", "secondaryEmail"]),
];

const POST_RetrieveUserInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:read", res)) {
      return;
    }
    const field = (req.body.field as string) || "_id";
    const targets = req.body.targets as string[];
    const isClient = res.locals.user.isClient;
    if (targets.length > (Configuration.get("get-user-max-items") as number)) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.clientInputError));
      return;
    }
    const users = (await UserModel.find(
      {
        [field]: { $in: targets },
      },
      isClient ? UserClientProjection : UserAdminProjection,
    )
      .lean()
      .exec()) as unknown as UserInterface[];
    await hydrateUserProfile(users);
    res.status(statusCodes.success).json(new SuccessResponse({ users }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default POST_RetrieveUserInfo;

