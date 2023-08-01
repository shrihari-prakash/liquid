import express from "express";

import GET__Stats from "./stats.get";
import { ClientAuthFlow, DelegatedAuthFlow } from "../middleware/authenticate";

const SystemRouter = express.Router();

SystemRouter.get("/admin-api/stats", ...DelegatedAuthFlow, GET__Stats);
SystemRouter.get("/client-api/stats", ...ClientAuthFlow, GET__Stats);

export default SystemRouter;
