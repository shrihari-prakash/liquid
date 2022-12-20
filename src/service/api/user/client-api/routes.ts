import express from "express";

import { ClientAuthFlow } from "../../middleware/authenticate";
import UserInfo from "./get-user-info";
import UserFollowers from "./user-followers";
import UserFollowing from "./user-following";

const ClientApiRouter = express.Router();

ClientApiRouter.post("/get-user-info", ...ClientAuthFlow, UserInfo);
ClientApiRouter.get("/user-following", ...ClientAuthFlow, UserFollowing);
ClientApiRouter.get("/user-followers", ...ClientAuthFlow, UserFollowers);

export default ClientApiRouter;
