import express from "express";
import { ClientAuthFlow } from "../../middleware/authenticate";
import GET__Stats from "../shared/stats.get";

const SystemClientRouter = express.Router();

SystemClientRouter.get("/stats", ...ClientAuthFlow, GET__Stats);

export default SystemClientRouter;
