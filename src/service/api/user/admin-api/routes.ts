import express from "express";

import { DelegatedAuthFlow } from "../../middleware/authenticate";
import AuthorizeAdmin from "../../middleware/authorize-admin";
import POST_Banned, { POST_BannedValidator } from "../shared/banned.post";
import POST_Access, { POST_AccessValidator } from "./access.post";
import GET_EditableFields from "./editable-fields.get";
import PATCH_User, { PATCH_UserValidator } from "./user.patch";

const AdminApiRouter = express.Router();

AdminApiRouter.post("/access", ...DelegatedAuthFlow, AuthorizeAdmin, POST_AccessValidator, POST_Access);
AdminApiRouter.get("/editable-fields", ...DelegatedAuthFlow, AuthorizeAdmin, GET_EditableFields);
AdminApiRouter.patch("/user", ...DelegatedAuthFlow, AuthorizeAdmin, PATCH_UserValidator, PATCH_User);
AdminApiRouter.post("/banned", ...DelegatedAuthFlow, AuthorizeAdmin, POST_BannedValidator, POST_Banned);

export default AdminApiRouter;
