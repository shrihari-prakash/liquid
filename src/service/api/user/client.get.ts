import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import ClientModel from "../../../model/mongo/client";
import { hasErrors } from "../../../utils/api";

export const GET_ClientValidator = [query("id").optional().isString().isLength({ min: 3, max: 256 })];

const GET_Client = async (req: Request, res: Response) => {
  try {
    if (hasErrors(req, res)) return;
    if (!req.params.clientId && !req.query.id) {
      return res.status(statusCodes.clientInputError).json(
        new ErrorResponse(errorMessages.clientInputError, {
          errors: [
            {
              msg: "Invalid value",
              param: "id",
              location: "query",
            },
          ],
        })
      );
    }
    const id = req.params.clientId || req.query.id;
    const client = (await ClientModel.findOne({ id }, { id: 1, role: 1, displayName: 1, _id: 0 }).lean().exec()) as any;
    res.status(statusCodes.success).json(new SuccessResponse({ client }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Client;
