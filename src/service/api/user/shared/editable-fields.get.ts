import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user/admin-api/editable-fields.get" });

import { Request, Response } from "express";

import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";
import { userSchema } from "../../../../model/mongo/user.js";
import { isApplicationClient } from "../../../../model/oauth/utils.js";

const GET_EditableFields = async (_: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:configuration:read", res)) {
      return;
    }
    let editableFieldsFromConfig = [];
    const currentUser = res.locals.oauth.token.user;
    if (isApplicationClient(currentUser)) {
      editableFieldsFromConfig = Configuration.get("client-api.user.profile.editable-fields");
    } else {
      editableFieldsFromConfig = Configuration.get("admin-api.user.profile.editable-fields");
    }
    const editableFields = [];
    for (let i = 0; i < editableFieldsFromConfig.length; i++) {
      let field = editableFieldsFromConfig[i];
      const fieldSensitivityScore = userSchema[field as keyof typeof userSchema]?.sensitivityScore?.write;
      if (
        ScopeManager.isScopeAllowed(
          `${isApplicationClient(currentUser) ? "client" : "admin"}:profile:sensitive:${fieldSensitivityScore}:write`,
          res.locals?.oauth?.token?.scope,
        )
      ) {
        editableFields.push(field);
      }
    }
    res.status(statusCodes.success).json(new SuccessResponse({ editableFields }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_EditableFields;

