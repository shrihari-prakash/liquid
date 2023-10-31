import express from "express";

import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post";
import POST_Access, { POST_AccessValidator } from "../shared/access.post";
import POST_Verify, { POST_VerifyValidator } from "./verify.post";
import POST_Create, { POST_CreateValidator } from "../shared/create.post";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post";
import POST_Client, { POST_ClientValidator } from "./client.post";
import GET_List from "../shared/list.get";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get";
import GET_EditableFields from "./editable-fields.get";
import GET_Roles from "../shared/roles.get";
import PATCH_User, { PATCH_UserValidator } from "./user.patch";
import GET_SubscriptionTiers from "../shared/subscription-tiers.get";

const AdminApiRouter = express.Router();

AdminApiRouter.get("/user-info", ...DelegatedAuthFlow, GET_UserInfoValidator, GET_UserInfo);
AdminApiRouter.post("/access", ...DelegatedAuthFlow, POST_AccessValidator, POST_Access);
AdminApiRouter.post("/client", ...DelegatedAuthFlow, POST_ClientValidator, POST_Client);
AdminApiRouter.get("/editable-fields", ...DelegatedAuthFlow, GET_EditableFields);
AdminApiRouter.get("/roles", ...DelegatedAuthFlow, GET_Roles);
AdminApiRouter.patch("/user", ...DelegatedAuthFlow, PATCH_UserValidator, PATCH_User);
AdminApiRouter.post("/ban", ...DelegatedAuthFlow, POST_BanValidator, POST_Ban);
AdminApiRouter.post("/credits", ...DelegatedAuthFlow, POST_CreditsValidator, POST_Credits);
AdminApiRouter.post("/restrict", ...DelegatedAuthFlow, POST_RestrictValidator, POST_Restrict);
AdminApiRouter.post("/verify", ...DelegatedAuthFlow, POST_VerifyValidator, POST_Verify);
AdminApiRouter.post("/subscription", ...DelegatedAuthFlow, POST_SubscriptionValidator, POST_Subscription);
AdminApiRouter.get("/subscription-tiers", ...DelegatedAuthFlow, GET_SubscriptionTiers);
AdminApiRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
AdminApiRouter.get("/list", ...DelegatedAuthFlow, GET_List);

export default AdminApiRouter;
