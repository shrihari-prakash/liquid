import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "system/settings.get" });

import { Request, Response } from "express";
import { ScopeManager } from "../../../singleton/scope-manager.js";
import { errorMessages, statusCodes } from "../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.js";
import { Configuration } from "../../../singleton/configuration.js";

const GET_Settings = async (_: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("delegated:system:settings:read", res)) {
      return;
    }
    const settings: any = {};
    [...Configuration.get("system.exposed-options"), Configuration.get("system.exposed-options.insecure")].forEach(
      (optionName: string) => {
        settings[optionName] = Configuration.get(optionName);
      }
    );
    res.status(statusCodes.success).json(new SuccessResponse({ settings }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Settings;
