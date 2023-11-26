import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "system/country-codes" });

import { Request, Response } from "express";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { countries } from "../../../utils/country-codes";

const GET__CountriesInsecure = async (_: Request, res: Response) => {
  try {
    return res.status(statusCodes.success).json(new SuccessResponse({ countries }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET__CountriesInsecure;
