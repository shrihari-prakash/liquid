import express from "express";

import { DelegatedAuthFlow } from "../../middleware/authenticate";
import AuthorizeAdmin from "../../middleware/authorize-admin";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get";
import POST_Access, { POST_AccessValidator } from "./access.post";
import GET_EditableFields from "./editable-fields.get";
import PATCH_User, { PATCH_UserValidator } from "./user.patch";
import POST_Verify, { POST_VerifyValidator } from "./verify.post";

const AdminApiRouter = express.Router();

AdminApiRouter.get("/user-info", ...DelegatedAuthFlow, AuthorizeAdmin, GET_UserInfoValidator, GET_UserInfo);
AdminApiRouter.post("/access", ...DelegatedAuthFlow, AuthorizeAdmin, POST_AccessValidator, POST_Access);
AdminApiRouter.get("/editable-fields", ...DelegatedAuthFlow, AuthorizeAdmin, GET_EditableFields);
AdminApiRouter.patch("/user", ...DelegatedAuthFlow, AuthorizeAdmin, PATCH_UserValidator, PATCH_User);
AdminApiRouter.post("/ban", ...DelegatedAuthFlow, AuthorizeAdmin, POST_BanValidator, POST_Ban);
AdminApiRouter.post("/restrict", ...DelegatedAuthFlow, AuthorizeAdmin, POST_RestrictValidator, POST_Restrict);
AdminApiRouter.post("/verify", ...DelegatedAuthFlow, AuthorizeAdmin, POST_VerifyValidator, POST_Verify);
AdminApiRouter.post(
  "/subscription",
  ...DelegatedAuthFlow,
  AuthorizeAdmin,
  POST_SubscriptionValidator,
  POST_Subscription
);

export default AdminApiRouter;
