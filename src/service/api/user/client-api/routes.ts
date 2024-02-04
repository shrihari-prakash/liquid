import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { ClientAuthFlow } from "../../middleware/authenticate";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post";
import POST_Create, { POST_CreateValidator } from "../shared/create.post";
import POST_Credits, { POST_CreditsValidator } from "../shared/credits.post";
import POST_Access, { POST_AccessValidator } from "../shared/access.post";
import POST_InviteCodes, { POST_InviteCodesValidator } from "../shared/invite-codes.post";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get";
import GET_UserFollowers, { GET_UserFollowersValidator } from "./user-followers.get";
import GET_UserFollowing, { GET_UserFollowingValidator } from "./user-following.get";
import GET_BlockStatus, { GET_BlockStatusValidator } from "./block-status.get";
import GET_List from "../shared/list.get";
import GET_InviteCodes, { GET_InviteCodesValidator } from "../shared/invite-codes.get";
import PUT_CustomData, { PUT_CustomDataValidator } from "../shared/custom-data.put";
import GET_LoginHistory, { GET_LoginHistoryValidator } from "../shared/login-history.get";

const ClientApiRouter = express.Router();

ClientApiRouter.get("/user-info", ...ClientAuthFlow, GET_UserInfoValidator, GET_UserInfo);
ClientApiRouter.post("/ban", ...ClientAuthFlow, POST_BanValidator, POST_Ban);
ClientApiRouter.post("/credits", ...ClientAuthFlow, POST_CreditsValidator, POST_Credits);
ClientApiRouter.post("/restrict", ...ClientAuthFlow, POST_RestrictValidator, POST_Restrict);
ClientApiRouter.post("/subscription", ...ClientAuthFlow, POST_SubscriptionValidator, POST_Subscription);
ClientApiRouter.get("/block-status", ...ClientAuthFlow, GET_BlockStatusValidator, GET_BlockStatus);
ClientApiRouter.post("/create", ...ClientAuthFlow, POST_CreateValidator, POST_Create);
ClientApiRouter.get("/list", ...ClientAuthFlow, GET_List);
ClientApiRouter.post("/access", ...ClientAuthFlow, POST_AccessValidator, POST_Access);
ClientApiRouter.put("/custom-data", ...ClientAuthFlow, PUT_CustomDataValidator, PUT_CustomData);
ClientApiRouter.get("/login-history", ...ClientAuthFlow, GET_LoginHistoryValidator, GET_LoginHistory);

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
