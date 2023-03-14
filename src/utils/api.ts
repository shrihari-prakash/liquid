import { Request, Response } from "express";
import { errorMessages, statusCodes } from "./http-status";
import { ErrorResponse } from "./response";

const { validationResult } = require("express-validator");

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
