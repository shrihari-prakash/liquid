import express from "express";

import GET__Stats from "./stats.get";
import { ClientAuthFlow, DelegatedAuthFlow } from "../middleware/authenticate";
import GET__Settings from "./settings.get";
import GET__SettingsInsecure from "./settings-insecure.get";

const SystemRouter = express.Router();

SystemRouter.get("/settings", ...DelegatedAuthFlow, GET__Settings);
SystemRouter.get("/settings-insecure", GET__SettingsInsecure);
SystemRouter.get("/admin-api/stats", ...DelegatedAuthFlow, GET__Stats);
SystemRouter.get("/client-api/stats", ...ClientAuthFlow, GET__Stats);

export default SystemRouter;
