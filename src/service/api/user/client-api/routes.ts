import express from "express";

import { Configuration } from "../../../../singleton/configuration.js";
import { ClientAuthFlow } from "../../middleware/authenticate.js";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post.js";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post.js";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post.js";
import POST_SubscriptionCancel, { POST_SubscriptionCancelValidator } from "../shared/subscription-cancel.post.js";
import POST_Create, { POST_CreateValidator } from "../shared/create.post.js";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post.js";
import POST_Access, { POST_AccessValidator } from "../shared/access.post.js";
import POST_InviteCodes, { POST_InviteCodesValidator } from "../shared/invite-codes.post.js";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get.js";
import POST_RetrieveUserInfo, { POST_RetrieveUserInfoValidator } from "../shared/retrieve-user-info.post.js";
import GET_UserFollowers, { GET_UserFollowersValidator } from "./user-followers.get.js";
import GET_UserFollowing, { GET_UserFollowingValidator } from "./user-following.get.js";
import GET_BlockStatus, { GET_BlockStatusValidator } from "./block-status.get.js";
import GET_List from "../shared/list.get.js";
import GET_InviteCodes, { GET_InviteCodesValidator } from "../shared/invite-codes.get.js";
import PUT_CustomData, { PUT_CustomDataValidator } from "../shared/custom-data.put.js";
import GET_LoginHistory, { GET_LoginHistoryValidator } from "../shared/login-history.get.js";
import PATCH_Update, { PATCH_UpdateValidator } from "../shared/update.patch.js";
import GET_EditableFields from "../shared/editable-fields.get.js";
import POST_Search, { POST_SearchValidator } from "./search.post.js";

const ClientApiRouter = express.Router();

ClientApiRouter.post("/retrieve-user-info", ...ClientAuthFlow, POST_RetrieveUserInfoValidator, POST_RetrieveUserInfo);
ClientApiRouter.post("/ban", ...ClientAuthFlow, POST_BanValidator, POST_Ban);
ClientApiRouter.post("/credits", ...ClientAuthFlow, POST_CreditsValidator, POST_Credits);
ClientApiRouter.post("/restrict", ...ClientAuthFlow, POST_RestrictValidator, POST_Restrict);
ClientApiRouter.post("/subscription", ...ClientAuthFlow, POST_SubscriptionValidator, POST_Subscription);
ClientApiRouter.post(
  "/subscription-cancel",
  ...ClientAuthFlow,
  POST_SubscriptionCancelValidator,
  POST_SubscriptionCancel,
);
ClientApiRouter.get("/block-status", ...ClientAuthFlow, GET_BlockStatusValidator, GET_BlockStatus);
ClientApiRouter.post("/create", ...ClientAuthFlow, POST_CreateValidator, POST_Create);
ClientApiRouter.get("/list", ...ClientAuthFlow, GET_List);
ClientApiRouter.post("/access", ...ClientAuthFlow, POST_AccessValidator, POST_Access);
ClientApiRouter.get("/editable-fields", ...ClientAuthFlow, GET_EditableFields);
ClientApiRouter.patch("/update", ...ClientAuthFlow, PATCH_UpdateValidator, PATCH_Update);
ClientApiRouter.put("/custom-data", ...ClientAuthFlow, PUT_CustomDataValidator, PUT_CustomData);
ClientApiRouter.get("/login-history", ...ClientAuthFlow, GET_LoginHistoryValidator, GET_LoginHistory);
ClientApiRouter.post("/search", ...ClientAuthFlow, POST_SearchValidator, POST_Search);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  ClientApiRouter.get("/follow-status", ...ClientAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  ClientApiRouter.get("/user-following", ...ClientAuthFlow, GET_UserFollowingValidator, GET_UserFollowing);
  ClientApiRouter.get("/user-followers", ...ClientAuthFlow, GET_UserFollowersValidator, GET_UserFollowers);
}

const canUseInviteOnly =
  Configuration.get("user.account-creation.enable-invite-only") ||
  Configuration.get("user.account-creation.force-generate-invite-codes");
if (canUseInviteOnly) {
  ClientApiRouter.get("/invite-codes", ...ClientAuthFlow, GET_InviteCodesValidator, GET_InviteCodes);
  ClientApiRouter.post("/invite-codes", ...ClientAuthFlow, POST_InviteCodesValidator, POST_InviteCodes);
}

export default ClientApiRouter;

