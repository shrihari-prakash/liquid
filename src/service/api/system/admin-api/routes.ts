import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import GET__Stats from "../shared/stats.get.js";

const SystemAdminRouter = express.Router();

SystemAdminRouter.get("/stats", ...DelegatedAuthFlow, GET__Stats);

export default SystemAdminRouter;
