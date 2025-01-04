import express from "express";
import { DelegatedAuthFlow } from "../middleware/authenticate.js";
import GET_List from "./list.get.js";
import RolesAdminRouter from "./admin-api/routes.js";
import RolesClientRouter from "./client-api/routes.js";

const RolesRouter = express.Router();

// Delegated APIs
RolesRouter.get("/list", ...DelegatedAuthFlow, GET_List);

// Admin APIs
RolesRouter.use("/admin-api", RolesAdminRouter);

// Client APIs
RolesRouter.use("/client-api", RolesClientRouter);

export default RolesRouter;
