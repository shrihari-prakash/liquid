import express from "express";

import { Configuration } from "../../../singleton/configuration";
import { DelegatedAuthFlow } from "../middleware/authenticate";
import ClientApiRouter from "./client-api/routes";
import POST_Create, { POST_CreateValidator } from "./create.post";
import POST_Follow, { POST_FollowValidator } from "./follow.post";
import POST_Login, { POST_LoginValidator } from "./login.post";
import POST_Unfollow from "./unfollow.post";
import POST_Private, { POST_PrivateValidator } from "./private.post";
import GET_Followers from "./followers.get";
import GET_Following from "./following.get";
import GET__UserId from "./_userId.get";
import GET_Me from "./me.get";
import GET_VerifyEmail, { GET_VerifyEmailValidator } from "./verify-email.get";
import GET_FollowRequests from "./follow-requests.get";
import PATCH_AcceptFollowRequest, {
  AcceptFollowRequestValidator as PATCH_AcceptFollowRequestValidator,
} from "./accept-follow-request.patch";
import PATCH_Me from "./me.patch";
import DELETE_FollowEntry, {
  DELETE_FollowEntryValidator as DELETE_FollowEntryValidator,
} from "./follow-entry.delete";

const UserRouter = express.Router();

//Core
UserRouter.post("/create", ...POST_CreateValidator, POST_Create);
UserRouter.post("/login", ...POST_LoginValidator, POST_Login);
UserRouter.get("/verify-email", ...GET_VerifyEmailValidator, GET_VerifyEmail);
UserRouter.post(
  "/private",
  ...DelegatedAuthFlow,
  ...POST_PrivateValidator,
  POST_Private
);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  //Friends
  UserRouter.post(
    "/follow",
    ...DelegatedAuthFlow,
    ...POST_FollowValidator,
    POST_Follow
  );
  UserRouter.post(
    "/unfollow",
    ...DelegatedAuthFlow,
    ...POST_FollowValidator,
    POST_Unfollow
  );
  UserRouter.get("/following", ...DelegatedAuthFlow, GET_Following);
  UserRouter.get("/followers", ...DelegatedAuthFlow, GET_Followers);
  UserRouter.get("/follow-requests", ...DelegatedAuthFlow, GET_FollowRequests);
  UserRouter.patch(
    "/accept-follow-request",
    ...DelegatedAuthFlow,
    ...PATCH_AcceptFollowRequestValidator,
    PATCH_AcceptFollowRequest
  );
  UserRouter.delete(
    "/follow-entry",
    ...DelegatedAuthFlow,
    ...DELETE_FollowEntryValidator,
    DELETE_FollowEntry
  );
}

// Application client APIs
UserRouter.use("/client-api", ClientApiRouter);

//User info
UserRouter.get("/me", ...DelegatedAuthFlow, GET_Me);
UserRouter.patch("/me", ...DelegatedAuthFlow, PATCH_Me);
UserRouter.get("/:userId", ...DelegatedAuthFlow, GET__UserId);

export default UserRouter;
