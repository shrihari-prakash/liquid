import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import POST_Create, { POST_CreateValidator } from "../shared/create.post.js";
import POST_Delete, { POST_DeleteValidator } from "../shared/delete.delete.js";
import POST_Update, { POST_UpdateValidator } from "../shared/update.patch.js";

const RolesAdminRouter = express.Router();

RolesAdminRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
RolesAdminRouter.delete("/delete", ...DelegatedAuthFlow, POST_DeleteValidator, POST_Delete);
RolesAdminRouter.patch("/update", ...DelegatedAuthFlow, POST_UpdateValidator, POST_Update);

export default RolesAdminRouter;
