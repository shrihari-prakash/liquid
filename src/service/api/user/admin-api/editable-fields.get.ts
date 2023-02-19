import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "admin-api/editable-fields" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { Configuration } from "../../../../singleton/configuration";

const GET_EditableFields = async (_: Request, res: Response) => {
  try {
    const editableFields = Configuration.get("admin-api.profile.editable-fields");
    res.status(statusCodes.success).json(new SuccessResponse({ editableFields }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_EditableFields;
