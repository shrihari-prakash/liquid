import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Client, { POST_ClientValidator } from "./client.post";
import GET_List from "./list.get";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/create", ...DelegatedAuthFlow, POST_ClientValidator, POST_Client);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_List);

export default ClientAdminRouter;
