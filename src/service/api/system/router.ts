import express from "express";

import SystemClientRouter from "./client-api/routes.js";
import SystemAdminRouter from "./admin-api/routes.js";
import { DelegatedAuthFlow } from "../middleware/authenticate.js";
import GET__Settings from "./settings.get.js";
import GET__SettingsInsecure from "./settings-insecure.get.js";
import GET__Version from "./version.get.js";
import GET__CountriesInsecure from "./countries-insecure.get.js";

const SystemRouter = express.Router();

// Delegated APIs
SystemRouter.get("/settings", ...DelegatedAuthFlow, GET__Settings);
SystemRouter.get("/settings-insecure", GET__SettingsInsecure);
SystemRouter.get("/countries-insecure", GET__CountriesInsecure);
SystemRouter.get("/version", GET__Version);

// Admin APIs
SystemRouter.use("/admin-api", SystemAdminRouter);

// Application client APIs
SystemRouter.use("/client-api", SystemClientRouter);

export default SystemRouter;
