import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { ClientAuthFlow } from "../../middleware/authenticate";
import POST_Ban, { POST_BanValidator } from "../shared/ban.post";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get";
import GET_UserInfo, { GET_UserInfoValidator } from "../shared/user-info.get";
import GET_UserFollowers, { GET_UserFollowersValidator } from "./user-followers.get";
import GET_UserFollowing, { GET_UserFollowingValidator } from "./user-following.get";
import GET_BlockStatus, { GET_BlockStatusValidator } from "./block-status.get";
import POST_Restrict, { POST_RestrictValidator } from "../shared/restrict.post";
import POST_Subscription, { POST_SubscriptionValidator } from "../shared/subscription.post";

const ClientApiRouter = express.Router();

ClientApiRouter.get("/user-info", ...ClientAuthFlow, GET_UserInfoValidator, GET_UserInfo);
ClientApiRouter.post("/ban", ...ClientAuthFlow, POST_BanValidator, POST_Ban);
ClientApiRouter.post("/restrict", ...ClientAuthFlow, POST_RestrictValidator, POST_Restrict);
ClientApiRouter.post("/subscription", ...ClientAuthFlow, POST_SubscriptionValidator, POST_Subscription);
ClientApiRouter.get("/block-status", ...ClientAuthFlow, GET_BlockStatusValidator, GET_BlockStatus);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  ClientApiRouter.get("/follow-status", ...ClientAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  ClientApiRouter.get("/user-following", ...ClientAuthFlow, GET_UserFollowingValidator, GET_UserFollowing);
  ClientApiRouter.get("/user-followers", ...ClientAuthFlow, GET_UserFollowersValidator, GET_UserFollowers);
}

export default ClientApiRouter;
