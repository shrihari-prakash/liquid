import express from "express";

import { DelegatedAuthFlow } from "../middleware/authenticate";
import Create, { CreateValidator } from "./create";
import Follow, { FollowValidator } from "./follow";
import Followers from "./followers";
import Following from "./following";
import _UserId from "./_userId";
import Login, { LoginValidator } from "./login";
import Me from "./me";
import Unfollow from "./unfollow";
import VerifyEmail, { VerifyEmailValidator } from "./verify-email";
import ClientApiRouter from "./client-api/routes";
import SwitchPrivate, { SwitchPrivateValidator } from "./private";
import FollowRequests from "./follow-requests";
import AcceptFollowRequest, {
  AcceptFollowRequestValidator,
} from "./accept-follow-request";

const UserRouter = express.Router();

//Core
UserRouter.post("/create", ...CreateValidator, Create);
UserRouter.post("/login", ...LoginValidator, Login);
UserRouter.get("/verify-email", ...VerifyEmailValidator, VerifyEmail);
UserRouter.post(
  "/private",
  ...DelegatedAuthFlow,
  ...SwitchPrivateValidator,
  SwitchPrivate
);

//Friends
UserRouter.post("/follow", ...DelegatedAuthFlow, ...FollowValidator, Follow);
UserRouter.post(
  "/unfollow",
  ...DelegatedAuthFlow,
  ...FollowValidator,
  Unfollow
);
UserRouter.get("/following", ...DelegatedAuthFlow, Following);
UserRouter.get("/followers", ...DelegatedAuthFlow, Followers);
UserRouter.get("/follow-requests", ...DelegatedAuthFlow, FollowRequests);
UserRouter.patch(
  "/accept-follow-request",
  ...DelegatedAuthFlow,
  ...AcceptFollowRequestValidator,
  AcceptFollowRequest
);

// Application client APIs
UserRouter.use("/client-api", ClientApiRouter);

//User info
UserRouter.get("/me", ...DelegatedAuthFlow, Me);
UserRouter.get("/:userId", ...DelegatedAuthFlow, _UserId);

export default UserRouter;
