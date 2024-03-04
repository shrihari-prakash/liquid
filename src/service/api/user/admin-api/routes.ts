import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post";
import POST_Access, { POST_AccessValidator } from "../shared/access.post";
import POST_Verify, { POST_VerifyValidator } from "./verify.post";
import POST_Create, { POST_CreateValidator } from "../shared/create.post";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post";
import POST_InviteCodes, { POST_InviteCodesValidator } from "../shared/invite-codes.post";
import GET_List from "../shared/list.get";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get";
import GET_EditableFields from "./editable-fields.get";
import GET_Roles from "../shared/roles.get";
import PATCH_Update, { PATCH_UpdateValidator } from "./update.patch";
import GET_SubscriptionTiers from "../shared/subscription-tiers.get";
import GET_InviteCodes, { GET_InviteCodesValidator } from "../shared/invite-codes.get";
import PUT_CustomData, { PUT_CustomDataValidator } from "../shared/custom-data.put";
import GET_LoginHistory, { GET_LoginHistoryValidator } from "../shared/login-history.get";
import POST_Search, { POST_SearchValidator } from "./search.post";

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
