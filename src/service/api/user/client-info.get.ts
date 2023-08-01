import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/client-info" });

import { Request, Response } from "express";
import { query } from "express-validator";

import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import ClientModel from "../../../model/mongo/client";

export const GET_ClientInfoValidator = [query("id").exists().isString().isLength({ min: 3, max: 128 })];

const GET_ClientInfo = async (req: Request, res: Response) => {
  try {
    const id = req.query.id;
    const client = (await ClientModel.findOne({ id }, { id: 1, role: 1, displayName: 1, _id: 0 }).lean().exec()) as any;
    res.status(statusCodes.success).json(new SuccessResponse({ client }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_ClientInfo;
