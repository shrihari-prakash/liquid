import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import POST_Create, { POST_CreateValidator } from "./create.post.js";
import GET_List from "./list.get.js";
import DELETE_Delete, { DELETE_DeleteValidator } from "./delete.delete.js";
import PATCH_Update, { PATCH_UpdateValidator } from "./update.patch.js";

const ClientAdminRouter = express.Router();

ClientAdminRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
ClientAdminRouter.get("/list", ...DelegatedAuthFlow, GET_List);
ClientAdminRouter.patch("/update", ...DelegatedAuthFlow, PATCH_UpdateValidator, PATCH_Update);
ClientAdminRouter.delete("/delete", ...DelegatedAuthFlow, DELETE_DeleteValidator, DELETE_Delete);

export default ClientAdminRouter;
