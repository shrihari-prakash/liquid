import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "admin-api/editable-fields" });

import { Request, Response } from "express";
import { body } from "express-validator";
import { isValidObjectId } from "mongoose";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { ScopeManager } from "../../../../singleton/scope-manager";
import ClientModel from "../../../../model/mongo/client";
import { hasErrors } from "../../../../utils/api";

export const POST_CreateValidator = [body("target").exists().isString().isLength({ max: 64 }).custom(isValidObjectId)];

const DELETE_Delete = async (req: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:system:client:delete", res)) {
      return;
    }
    if (hasErrors(req, res)) return;
    const target = req.body.target;
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
