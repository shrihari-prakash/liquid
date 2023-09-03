import express from "express";

import SystemClientRouter from "./client-api/routes";
import SystemAdminRouter from "./admin-api/routes";
import { DelegatedAuthFlow } from "../middleware/authenticate";
import GET__Settings from "./settings.get";
import GET__SettingsInsecure from "./settings-insecure.get";
import GET__Version from "./version.get";

const SystemRouter = express.Router();

// Delegated APIs
SystemRouter.get("/settings", ...DelegatedAuthFlow, GET__Settings);
SystemRouter.get("/settings-insecure", GET__SettingsInsecure);
SystemRouter.get("/version", GET__Version);

// Admin APIs
SystemRouter.use("/admin-api", SystemAdminRouter);

// Application client APIs
SystemRouter.use("/client-api", SystemClientRouter);

export default SystemRouter;
