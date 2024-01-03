import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/common-api/get-user-info" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import UserModel, { UserAdminProjection, UserClientProjection, UserInterface } from "../../../../model/mongo/user";
import { getPaginationLimit } from "../../../../utils/pagination";
import { ScopeManager } from "../../../../singleton/scope-manager";
import { hydrateUserProfile } from "../../../../utils/user";

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
