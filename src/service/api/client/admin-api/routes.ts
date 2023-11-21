import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Create, { POST_CreateValidator } from "./create";
import GET_List from "./list.get";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_List);

export default ClientAdminRouter;
