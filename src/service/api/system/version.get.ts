import { Request, Response } from "express";
import fs from "fs";

import { statusCodes } from "../../../utils/http-status.js";
import { SuccessResponse } from "../../../utils/response.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = fs.readFileSync(path.join(__dirname, "../../../", "VERSION"), { encoding: "utf8" });

const GET_Version = async (_: Request, res: Response) => {
  res.status(statusCodes.success).json(new SuccessResponse({ version }));
};

export default GET_Version;

