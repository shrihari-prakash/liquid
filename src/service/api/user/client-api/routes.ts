import express from "express";

import { Configuration } from "../../../../singleton/configuration";
import { ClientAuthFlow } from "../../middleware/authenticate";
import FollowStatus from "./follow-status";
import UserInfo from "./get-user-info";
import UserFollowers from "./user-followers";
import UserFollowing from "./user-following";

const ClientApiRouter = express.Router();

ClientApiRouter.post("/get-user-info", ...ClientAuthFlow, UserInfo);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  ClientApiRouter.get("/follow-status", ...ClientAuthFlow, FollowStatus);
  ClientApiRouter.get("/user-following", ...ClientAuthFlow, UserFollowing);
  ClientApiRouter.get("/user-followers", ...ClientAuthFlow, UserFollowers);
}

export default ClientApiRouter;
