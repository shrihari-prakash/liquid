import { Logger } from "../../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "system/shared/stats.get" });

import { Request, Response } from "express";
import * as os from "os";
import * as v8 from "v8";

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
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const heapTotal = memUsage.heapTotal / 1024 / 1024;
    const heapUsed = memUsage.heapUsed / 1024 / 1024;
    const heapLimit = heapStats.heap_size_limit / 1024 / 1024;
    const rss = memUsage.rss / 1024 / 1024;
    const systemTotalMemory = os.totalmem() / 1024 / 1024;
    const systemFreeMemory = os.freemem() / 1024 / 1024;

    const cpus = os.cpus();
    const loadAvg = os.loadavg().map((load) => Math.round(load * 100) / 100);

    const stats = {
      processId: process.pid,
      platform: process.platform,
      arch: os.arch(),
      nodeVersion: process.version,
      cpuMake: cpus[0]?.model || "Unknown",
      cpuCount: cpus.length,
      loadAvg,
      upTime: process.uptime(),
      requestsHandled: app.get(Configuration.get("system.stats.request-count-key")),
      heapTotal: Math.round(heapTotal * 100) / 100,
      heapUsed: Math.round(heapUsed * 100) / 100,
      heapLimit: Math.round(heapLimit * 100) / 100,
      rss: Math.round(rss * 100) / 100,
      systemTotalMemory: Math.round(systemTotalMemory * 100) / 100,
      systemFreeMemory: Math.round(systemFreeMemory * 100) / 100,
    };
    res.status(statusCodes.success).json(new SuccessResponse({ stats }));
  } catch (err) {
    log.error(err);
    res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET_Stats;
