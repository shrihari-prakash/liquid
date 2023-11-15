import express from "express";

import SystemAdminRouter from "./admin-api/routes";
import GET_Client, { GET_ClientValidator } from "./client.get";

const ClientRouter = express.Router();

// Delegated APIs
ClientRouter.get("/", GET_ClientValidator, GET_Client);
ClientRouter.get("/:clientId", GET_ClientValidator, GET_Client);

// Admin APIs
ClientRouter.use("/admin-api", SystemAdminRouter);

export default ClientRouter;
