import express from "express";
import { ClientAuthFlow } from "../../middleware/authenticate.js";
import POST_Create, { POST_CreateValidator } from "../shared/create.post.js";
import POST_Delete, { POST_DeleteValidator } from "../shared/delete.delete.js";
import POST_Update, { POST_UpdateValidator } from "../shared/update.patch.js";

const RolesClientRouter = express.Router();

RolesClientRouter.post("/create", ...ClientAuthFlow, POST_CreateValidator, POST_Create);
RolesClientRouter.delete("/delete", ...ClientAuthFlow, POST_DeleteValidator, POST_Delete);
RolesClientRouter.patch("/update", ...ClientAuthFlow, POST_UpdateValidator, POST_Update);

export default RolesClientRouter;

