import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user/code" });

import { Request, Response } from "express";
const os = require("os");

import app from "../../..";
import { errorMessages, statusCodes } from "../../../utils/http-status";
import { ErrorResponse, SuccessResponse } from "../../../utils/response";
import { Configuration } from "../../../singleton/configuration";

const GET__Stats = async (_: Request, res: Response) => {
  try {
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
    return res.status(statusCodes.created).json(new SuccessResponse(stats));
  } catch (err) {
    log.error(err);
    return res.status(statusCodes.internalError).json(new ErrorResponse(errorMessages.internalError));
  }
};

export default GET__Stats;
