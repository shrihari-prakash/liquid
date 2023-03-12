import express from "express";

import { Configuration } from "../../../singleton/configuration";
import { DelegatedAuthFlow } from "../middleware/authenticate";
import ClientApiRouter from "./client-api/routes";
import POST_Create, { POST_CreateValidator } from "./create.post";
import POST_Follow, { POST_FollowValidator } from "./follow.post";
import POST_Login, { POST_LoginValidator } from "./login.post";
import POST_Unfollow from "./unfollow.post";
import POST_Private, { POST_PrivateValidator } from "./private.post";
import POST_Search, { POST_SearchValidator } from "./search.post";
import GET_Code, { GET_CodeValidator } from "./code.get";
import POST_ResetPassword, { POST_ResetPasswordValidator } from "./reset-password.post";
import GET_Followers from "./followers.get";
import GET_Following from "./following.get";
import GET__UserId from "./_userId.get";
import GET_Me from "./me.get";
import GET_VerifyEmail, { GET_VerifyEmailValidator } from "./verify-email.get";
import GET_FollowRequests from "./follow-requests.get";
import PATCH_AcceptFollowRequest, { PATCH_AcceptFollowRequestValidator } from "./accept-follow-request.patch";
import PATCH_Me from "./me.patch";
import DELETE_FollowEntry, { DELETE_FollowEntryValidator } from "./follow-entry.delete";
import AdminApiRouter from "./admin-api/routes";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get";
import POST_Block, { POST_BlockValidator } from "./block.post";
import POST_Unblock, { POST_UnblockValidator } from "./unblock.post";

const UserRouter = express.Router();

//Core
UserRouter.post("/create", ...POST_CreateValidator, POST_Create);
UserRouter.post("/login", ...POST_LoginValidator, POST_Login);
UserRouter.get("/verify-email", ...GET_VerifyEmailValidator, GET_VerifyEmail);
UserRouter.post("/private", ...DelegatedAuthFlow, ...POST_PrivateValidator, POST_Private);
UserRouter.get("/code", ...GET_CodeValidator, GET_Code);
UserRouter.post("/reset-password", ...POST_ResetPasswordValidator, POST_ResetPassword);
UserRouter.post("/search", ...DelegatedAuthFlow, ...POST_SearchValidator, POST_Search);

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  //Friends
  UserRouter.post("/follow", ...DelegatedAuthFlow, ...POST_FollowValidator, POST_Follow);
  UserRouter.post("/unfollow", ...DelegatedAuthFlow, ...POST_FollowValidator, POST_Unfollow);
  UserRouter.get("/following", ...DelegatedAuthFlow, GET_Following);
  UserRouter.get("/followers", ...DelegatedAuthFlow, GET_Followers);
  UserRouter.get("/follow-requests", ...DelegatedAuthFlow, GET_FollowRequests);
  UserRouter.get("/follow-status", ...DelegatedAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  UserRouter.patch(
    "/accept-follow-request",
    ...DelegatedAuthFlow,
    ...PATCH_AcceptFollowRequestValidator,
    PATCH_AcceptFollowRequest
  );
  UserRouter.delete("/follow-entry", ...DelegatedAuthFlow, ...DELETE_FollowEntryValidator, DELETE_FollowEntry);
}

// Application client APIs
UserRouter.use("/client-api", ClientApiRouter);

// Admin APIs
UserRouter.use("/admin-api", AdminApiRouter);

// User info
UserRouter.get("/me", ...DelegatedAuthFlow, GET_Me);
UserRouter.patch("/me", ...DelegatedAuthFlow, PATCH_Me);
UserRouter.get("/:userId", ...DelegatedAuthFlow, GET__UserId);

// Block - Unblock
UserRouter.post("/block", ...DelegatedAuthFlow, POST_BlockValidator, POST_Block);
UserRouter.post("/unblock", ...DelegatedAuthFlow, POST_UnblockValidator, POST_Unblock);

export default UserRouter;
