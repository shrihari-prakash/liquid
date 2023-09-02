import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import GET__Stats from "../shared/stats.get";

const SystemAdminRouter = express.Router();

SystemAdminRouter.get("/stats", ...DelegatedAuthFlow, GET__Stats);

export default SystemAdminRouter;
