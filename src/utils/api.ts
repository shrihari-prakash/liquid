import { Request, Response } from "express";
import { errorMessages, statusCodes } from "./http-status.js";
import { ErrorResponse } from "./response.js";

import { validationResult } from "express-validator";

export function hasErrors(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(statusCodes.clientInputError).json(
      new ErrorResponse(errorMessages.clientInputError, {
        errors: errors.array(),
      })
    );
    return true;
  }
}
