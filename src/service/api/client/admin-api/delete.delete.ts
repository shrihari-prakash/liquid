import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "client/admin-api/delete.delete" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { ScopeManager } from "../../../../singleton/scope-manager";
import ClientModel from "../../../../model/mongo/client";
import { hasErrors } from "../../../../utils/api";
import Role from "../../../../enum/role";

export const DELETE_DeleteValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
];

const DELETE_Delete = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const client = await ClientModel.findOne({ _id: target });
    if (!client) return res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidTarget));
    const requiredScope = client.role === Role.INTERNAL_CLIENT ? "admin:system:internal-client:delete" : "admin:system:external-client:delete"
    if (!ScopeManager.isScopeAllowedForSession(requiredScope, res)) {
      return;
    }
    const deleted = await ClientModel.deleteOne({ _id: target });
    log.debug("Client deleted successfully.");
    log.debug(deleted);
    res.status(statusCodes.success).json(new SuccessResponse());
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default DELETE_Delete;
