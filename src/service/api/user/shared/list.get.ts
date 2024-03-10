import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/shared/list.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import UserModel, { UserAdminProjection, UserClientProjection, UserInterface } from "../../../../model/mongo/user.js";
import { getPaginationLimit } from "../../../../utils/pagination.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { hydrateUserProfile } from "../../../../utils/user.js";

const GET_List = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:profile:read", res)) {
      return;
    }
    const query: any = {};
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    if (offset) {
      query["_id"] = { $gt: offset };
    }
    const isClient = res.locals.user.isClient;
    const users = (await UserModel.find(query, isClient ? UserClientProjection : UserAdminProjection)
      .limit(limit)
      .lean()
      .exec()) as unknown as UserInterface[];
    await hydrateUserProfile(users);
    const totalUsers = await UserModel.estimatedDocumentCount();
    res.status(statusCodes.success).json(new SuccessResponse({ users, totalUsers }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_List;
