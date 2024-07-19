import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "system/contries-insecure.get" });

import { Request, Response } from "express";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { countries } from "../../../utils/country-codes.js";

const GET_CountriesInsecure = async (_: Request, res: Response) => {
  try {
    return res.status(statusCodes.success).json(new SuccessResponse({ countries }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_CountriesInsecure;
