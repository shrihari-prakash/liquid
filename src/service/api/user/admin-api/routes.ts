import express from "express";

import { Configuration } from "../../../../singleton/configuration.js";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post.js";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post.js";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post.js";
import POST_Access, { POST_AccessValidator } from "../shared/access.post.js";
import POST_Verify, { POST_VerifyValidator } from "./verify.post.js";
import POST_Create, { POST_CreateValidator } from "../shared/create.post.js";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post.js";
import POST_InviteCodes, { POST_InviteCodesValidator } from "../shared/invite-codes.post.js";
import GET_List from "../shared/list.get.js";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get.js";
import GET_EditableFields from "./editable-fields.get.js";
import GET_Roles from "../shared/roles.get.js";
import PATCH_Update, { PATCH_UpdateValidator } from "./update.patch.js";
import GET_SubscriptionTiers from "../shared/subscription-tiers.get.js";
import GET_InviteCodes, { GET_InviteCodesValidator } from "../shared/invite-codes.get.js";
import PUT_CustomData, { PUT_CustomDataValidator } from "../shared/custom-data.put.js";
import GET_LoginHistory, { GET_LoginHistoryValidator } from "../shared/login-history.get.js";
import POST_Search, { POST_SearchValidator } from "./search.post.js";

const AdminApiRouter = express.Router();

AdminApiRouter.get("/user-info", ...DelegatedAuthFlow, GET_UserInfoValidator, GET_UserInfo);
AdminApiRouter.post("/access", ...DelegatedAuthFlow, POST_AccessValidator, POST_Access);
AdminApiRouter.get("/editable-fields", ...DelegatedAuthFlow, GET_EditableFields);
AdminApiRouter.get("/roles", ...DelegatedAuthFlow, GET_Roles);
AdminApiRouter.patch("/update", ...DelegatedAuthFlow, PATCH_UpdateValidator, PATCH_Update);
AdminApiRouter.post("/ban", ...DelegatedAuthFlow, POST_BanValidator, POST_Ban);
AdminApiRouter.post("/credits", ...DelegatedAuthFlow, POST_CreditsValidator, POST_Credits);
AdminApiRouter.post("/restrict", ...DelegatedAuthFlow, POST_RestrictValidator, POST_Restrict);
AdminApiRouter.post("/verify", ...DelegatedAuthFlow, POST_VerifyValidator, POST_Verify);
AdminApiRouter.post("/subscription", ...DelegatedAuthFlow, POST_SubscriptionValidator, POST_Subscription);
AdminApiRouter.get("/subscription-tiers", ...DelegatedAuthFlow, GET_SubscriptionTiers);
AdminApiRouter.post("/create", ...DelegatedAuthFlow, POST_CreateValidator, POST_Create);
AdminApiRouter.get("/list", ...DelegatedAuthFlow, GET_List);
AdminApiRouter.put("/custom-data", ...DelegatedAuthFlow, PUT_CustomDataValidator, PUT_CustomData);
AdminApiRouter.get("/login-history", ...DelegatedAuthFlow, GET_LoginHistoryValidator, GET_LoginHistory);

const canUseInviteOnly =
  Configuration.get("user.account-creation.enable-invite-only") ||
  Configuration.get("user.account-creation.force-generate-invite-codes");
if (canUseInviteOnly) {
  AdminApiRouter.get("/invite-codes", ...DelegatedAuthFlow, GET_InviteCodesValidator, GET_InviteCodes);
  AdminApiRouter.post("/invite-codes", ...DelegatedAuthFlow, POST_InviteCodesValidator, POST_InviteCodes);
}

if (Configuration.get("privilege.can-use-admin-user-search-api")) {
  AdminApiRouter.post("/search", ...DelegatedAuthFlow, ...POST_SearchValidator, POST_Search);
}

export default AdminApiRouter;
