import express from "express";
import { ClientAuthFlow } from "../../middleware/authenticate.js";
import GET_Stats from "../shared/stats.get.js";

const SystemClientRouter = express.Router();

SystemClientRouter.get("/stats", ...ClientAuthFlow, GET_Stats);

export default SystemClientRouter;
