import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Create, { POST_CreateValidator } from "./create.post";
import GET_List from "./list.get";
import DELETE_Delete, { DELETE_DeleteValidator } from "./delete.delete";
import PATCH_Update, { PATCH_UpdateValidator } from "./update.patch";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_List);
ClientAdminRouter.patch("/update", ...DelegatedAuthFlow, PATCH_UpdateValidator, PATCH_Update);
ClientAdminRouter.delete("/delete", ...DelegatedAuthFlow, DELETE_DeleteValidator, DELETE_Delete);

export default ClientAdminRouter;
