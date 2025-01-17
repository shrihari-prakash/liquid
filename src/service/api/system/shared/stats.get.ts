import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "system/shared/stats.get" });

import { Request, Response } from "express";
import * as os from "os";

import app from "../../../../index.js";
import { errorMessages, statusCodes } from "../../../../utils/http-status.js";
import { ErrorResponse, SuccessResponse } from "../../../../utils/response.js";
import { Configuration } from "../../../../singleton/configuration.js";
import { ScopeManager } from "../../../../singleton/scope-manager.js";

const GET_Stats = async (_: Request, res: Response): Promise<void> => {
  try {
    if (!ScopeManager.isScopeAllowedForSharedSession("<ENTITY>:system:all", res)) {
      return;
    }
    const heapTotal = process.memoryUsage().heapTotal / 1024 / 1024;
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const stats = {
      processId: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      cpuMake: os.cpus()[0].model,
      upTime: process.uptime(),
      requestsHandled: app.get(Configuration.get("system.stats.request-count-key")),
      heapTotal: Math.round(heapTotal * 100) / 100,
      heapUsed: Math.round(heapUsed * 100) / 100,
    };
    res.status(statusCodes.success).json(new SuccessResponse({ stats }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Stats;
