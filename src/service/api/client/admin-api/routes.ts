import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Create, { POST_CreateValidator } from "./create.post";
import GET_List from "./list.get";
import DELETE_Delete from "./delete.delete";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_List);
ClientAdminRouter.delete("/delete", ...DelegatedAuthFlow, DELETE_Delete);

export default ClientAdminRouter;
