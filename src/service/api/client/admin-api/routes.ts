import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Client, { POST_ClientValidator } from "./client.post";
import GET_Client_List from "./list.get";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/", ...DelegatedAuthFlow, POST_ClientValidator, POST_Client);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_Client_List);

export default ClientAdminRouter;
