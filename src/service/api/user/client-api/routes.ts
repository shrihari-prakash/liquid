import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { ClientAuthFlow } from "../../middleware/authenticate";
import POST_Banned from "./banned.post";
import GET_FollowStatus from "./follow-status.get";
import GET_UserInfo from "./user-info.get";
import GET_UserFollowers from "./user-followers.get";
import GET_UserFollowing from "./user-following.get";

const ClientApiRouter = express.Router();

ClientApiRouter.get("/user-info", ...ClientAuthFlow, GET_UserInfo);
ClientApiRouter.post("/banned", ...ClientAuthFlow, POST_Banned);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  ClientApiRouter.get("/follow-status", ...ClientAuthFlow, GET_FollowStatus);
  ClientApiRouter.get("/user-following", ...ClientAuthFlow, GET_UserFollowing);
  ClientApiRouter.get("/user-followers", ...ClientAuthFlow, GET_UserFollowers);
}

export default ClientApiRouter;
