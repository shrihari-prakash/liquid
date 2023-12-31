import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client/admin-api/list.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { getPaginationLimit } from "../../../../utils/pagination";
import { ScopeManager } from "../../../../singleton/scope-manager";
import ClientModel from "../../../../model/mongo/client";

const GET_List = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:system:client:read", res)) {
      return;
    }
    const query: any = {};
    const limit = getPaginationLimit(req.query.limit as string);
    const offset = req.query.offset as string;
    if (offset) {
      query["_id"] = { $gt: offset };
    }
    const clients = (await ClientModel.find(query).limit(limit).lean().exec()) as any[];
    res.status(statusCodes.success).json(new SuccessResponse({ clients }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_List;
