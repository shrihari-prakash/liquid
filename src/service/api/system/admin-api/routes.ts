import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import GET_Stats from "../shared/stats.get.js";

const SystemAdminRouter = express.Router();

SystemAdminRouter.get("/stats", ...DelegatedAuthFlow, GET_Stats);

export default SystemAdminRouter;
