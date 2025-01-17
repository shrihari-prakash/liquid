import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "client/admin-api/delete.delete" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import ClientModel from "../../../../model/mongo/client.js";
import { hasErrors } from "../../../../utils/api.js";
import { CORS } from "../../../../singleton/cors.js";
import { Role } from "../../../../singleton/role.js";

export const DELETE_DeleteValidator = [
  body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId),
];

const DELETE_Delete = async (req: Request, res: Response): Promise<void> => {
  try {
    if (hasErrors(req, res)) return;
    const target = req.body.target;
    const client = await ClientModel.findOne({ _id: target });
    if (!client) {
      res.status(statusCodes.clientInputError).json(new ErrorResponse(errorMessages.invalidTarget));
      return;
    }
    const requiredScope =
      client.role === Role.SystemRoles.INTERNAL_CLIENT
        ? "admin:system:internal-client:delete"
        : "admin:system:external-client:delete";
    if (!ScopeManager.isScopeAllowedForSession(requiredScope, res)) {
      return;
    }
    const deleted = await ClientModel.deleteOne({ _id: target });
    log.debug("Client deleted successfully.");
    log.debug(deleted);
    res.status(statusCodes.success).json(new SuccessResponse());
    CORS.scanOrigins();
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default DELETE_Delete;

