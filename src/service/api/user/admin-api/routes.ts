import express from "express";

import { Configuration } from "../../../../singleton/configuration.js";
import { DelegatedAuthFlow } from "../../middleware/authenticate.js";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post.js";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post.js";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post.js";
import POST_SubscriptionCancel, { POST_SubscriptionCancelValidator } from "../shared/subscription-cancel.post.js";
import POST_Access, { POST_AccessValidator } from "../shared/access.post.js";
import POST_Verify, { POST_VerifyValidator } from "./verify.post.js";
import POST_Create, { POST_CreateValidator } from "../shared/create.post.js";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post.js";
import POST_InviteCodes, { POST_InviteCodesValidator } from "../shared/invite-codes.post.js";
import GET_List from "../shared/list.get.js";
import POST_RetrieveUserInfo, { POST_RetrieveUserInfoValidator } from "../shared/retrieve-user-info.post.js";
import GET_EditableFields from "../shared/editable-fields.get.js";
import PATCH_Update, { PATCH_UpdateValidator } from "../shared/update.patch.js";
import GET_SubscriptionTiers from "../shared/subscription-tiers.get.js";
import GET_InviteCodes, { GET_InviteCodesValidator } from "../shared/invite-codes.get.js";
import PUT_CustomData, { PUT_CustomDataValidator } from "../shared/custom-data.put.js";
import GET_LoginHistory, { GET_LoginHistoryValidator } from "../shared/login-history.get.js";
import POST_Search, { POST_SearchValidator } from "./search.post.js";

const AdminApiRouter = express.Router();

AdminApiRouter.post("/retrieve-user-info", ...DelegatedAuthFlow, POST_RetrieveUserInfoValidator, POST_RetrieveUserInfo);
AdminApiRouter.post("/access", ...DelegatedAuthFlow, POST_AccessValidator, POST_Access);
AdminApiRouter.get("/editable-fields", ...DelegatedAuthFlow, GET_EditableFields);
AdminApiRouter.patch("/update", ...DelegatedAuthFlow, PATCH_UpdateValidator, PATCH_Update);
AdminApiRouter.post("/ban", ...DelegatedAuthFlow, POST_BanValidator, POST_Ban);
AdminApiRouter.post("/credits", ...DelegatedAuthFlow, POST_CreditsValidator, POST_Credits);
AdminApiRouter.post("/restrict", ...DelegatedAuthFlow, POST_RestrictValidator, POST_Restrict);
AdminApiRouter.post("/verify", ...DelegatedAuthFlow, POST_VerifyValidator, POST_Verify);
AdminApiRouter.post("/subscription", ...DelegatedAuthFlow, POST_SubscriptionValidator, POST_Subscription);
AdminApiRouter.post("/subscription-cancel", ...DelegatedAuthFlow, POST_SubscriptionCancelValidator, POST_SubscriptionCancel);
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
