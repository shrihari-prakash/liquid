import express from "express";

import SystemClientRouter from "./client-api/routes.js";
import SystemAdminRouter from "./admin-api/routes.js";
import { DelegatedAuthFlow } from "../middleware/authenticate.js";
import GET_Settings from "./settings.get.js";
import GET_SettingsInsecure from "./settings-insecure.get.js";
import GET_Version from "./version.get.js";
import GET_CountriesInsecure from "./countries-insecure.get.js";

const SystemRouter = express.Router();

// Delegated APIs
SystemRouter.get("/settings", ...DelegatedAuthFlow, GET_Settings);
SystemRouter.get("/settings-insecure", GET_SettingsInsecure);
SystemRouter.get("/countries-insecure", GET_CountriesInsecure);
SystemRouter.get("/version", GET_Version);

// Admin APIs
SystemRouter.use("/admin-api", SystemAdminRouter);

// Application client APIs
SystemRouter.use("/client-api", SystemClientRouter);

export default SystemRouter;
