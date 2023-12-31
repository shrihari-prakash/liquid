import { Logger } from "../../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/admin-api/editable-fields.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response";
import { Configuration } from "../../../../singleton/configuration";
import { ScopeManager } from "../../../../singleton/scope-manager";
import { userSchema } from "../../../../model/mongo/user";

const GET_EditableFields = async (_: Request, res: Response) => {
  try {
    if (!ScopeManager.isScopeAllowedForSession("admin:configuration:read", res)) {
      return;
    }
    const editableFieldsFromConfig = Configuration.get("admin-api.user.profile.editable-fields");
    const editableFields = [];
    for (let i = 0; i < editableFieldsFromConfig.length; i++) {
      let field = editableFieldsFromConfig[i];
      const fieldSensitivityScore = userSchema[(field as keyof typeof userSchema)]?.sensitivityScore?.write;
      if (ScopeManager.isScopeAllowed(`admin:profile:sensitive:${fieldSensitivityScore}:write`, res.locals?.oauth?.token?.scope)) {
        editableFields.push(field);
      }
    }
    res.status(statusCodes.success).json(new SuccessResponse({ editableFields }));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_EditableFields;
