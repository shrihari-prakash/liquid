import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "system/version" });

import { Request, Response } from "express";
import fs from "fs";

import { statusCodes } from "../../../utils/http-status";
import { SuccessResponse } from "../../../utils/response";
import path from "path";

const version = fs.readFileSync(path.join(__dirname, "../../../", "VERSION"), { encoding: "utf8" });
log.info("Liquid version %s", version);

const GET__Version = async (_: Request, res: Response) => {
  return res.status(statusCodes.success).json(new SuccessResponse({ version }));
};

export default GET__Version;
