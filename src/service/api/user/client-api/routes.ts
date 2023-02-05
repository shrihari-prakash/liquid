import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { ClientAuthFlow } from "../../middleware/authenticate";
import POST_Banned, { POST_BannedValidator } from "./banned.post";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get";
import GET_UserInfo from "./user-info.get";
import GET_UserFollowers, { GET_UserFollowersValidator } from "./user-followers.get";
import GET_UserFollowing, { GET_UserFollowingValidator } from "./user-following.get";

const ClientApiRouter = express.Router();

ClientApiRouter.get("/user-info", ...ClientAuthFlow, GET_UserInfo);
ClientApiRouter.post("/banned", ...ClientAuthFlow, POST_BannedValidator, POST_Banned);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  ClientApiRouter.get("/follow-status", ...ClientAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  ClientApiRouter.get("/user-following", ...ClientAuthFlow, GET_UserFollowingValidator, GET_UserFollowing);
  ClientApiRouter.get("/user-followers", ...ClientAuthFlow, GET_UserFollowersValidator, GET_UserFollowers);
}

export default ClientApiRouter;
