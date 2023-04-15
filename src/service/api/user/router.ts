import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "user-router" });

import express from "express";

import { Configuration } from "../../../singleton/configuration";
import { DelegatedAuthFlow } from "../middleware/authenticate";
import ClientApiRouter from "./client-api/routes";
import AdminApiRouter from "./admin-api/routes";
import POST_Create, { POST_CreateValidator } from "./create.post";
import POST_Follow, { POST_FollowValidator } from "./follow.post";
import POST_Login, { POST_LoginValidator } from "./login.post";
import POST_Unfollow from "./unfollow.post";
import POST_Private, { POST_PrivateValidator } from "./private.post";
import POST_Search, { POST_SearchValidator } from "./search.post";
import POST_ResetPassword, { POST_ResetPasswordValidator } from "./reset-password.post";
import POST_Block, { POST_BlockValidator } from "./block.post";
import POST_Unblock, { POST_UnblockValidator } from "./unblock.post";
import GET_Code, { GET_CodeValidator } from "./code.get";
import GET_Followers from "./followers.get";
import GET_Following from "./following.get";
import GET__UserId from "./_userId.get";
import GET_Me from "./me.get";
import GET_VerifyEmail, { GET_VerifyEmailValidator } from "./verify-email.get";
import GET_FollowRequests from "./follow-requests.get";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get";
import PATCH_AcceptFollowRequest, { PATCH_AcceptFollowRequestValidator } from "./accept-follow-request.patch";
import PATCH_Me, { PATCH_MeValidator } from "./me.patch";
import PATCH_ProfilePicture from "./profile-picture.patch";
import DELETE_FollowEntry, { DELETE_FollowEntryValidator } from "./follow-entry.delete";
import DELETE_ProfilePicture from "./profile-picture.delete";
import POST_Logout from "./logout.post";

const UserRouter = express.Router();

//Core
UserRouter.post("/create", ...POST_CreateValidator, POST_Create);
UserRouter.post("/login", ...POST_LoginValidator, POST_Login);
UserRouter.get("/verify-email", ...GET_VerifyEmailValidator, GET_VerifyEmail);
UserRouter.post("/private", ...DelegatedAuthFlow, ...POST_PrivateValidator, POST_Private);
UserRouter.get("/code", ...GET_CodeValidator, GET_Code);
UserRouter.post("/reset-password", ...POST_ResetPasswordValidator, POST_ResetPassword);
UserRouter.post("/search", ...DelegatedAuthFlow, ...POST_SearchValidator, POST_Search);
UserRouter.post("/logout", ...DelegatedAuthFlow, POST_Logout);

// Profile Picture
if (Configuration.get("privilege.can-use-profile-picture-apis")) {
  UserRouter.patch("/profile-picture", ...DelegatedAuthFlow, PATCH_ProfilePicture);
  UserRouter.delete("/profile-picture", ...DelegatedAuthFlow, DELETE_ProfilePicture);
} else {
  log.warn(
    "Usage of profile pictures is disabled, if you would like to use the feature, enable options `Can Use Profile Picture APIs (privilege.can-use-profile-picture-apis)` and `Can Use Cloud Storage (privilege.can-use-cloud-storage)`. This will require S3 or S3-like storage system."
  );
}

const canUseFollowAPIs = Configuration.get("privilege.can-use-follow-apis");
if (canUseFollowAPIs) {
  // Friends
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
UserRouter.patch("/me", ...DelegatedAuthFlow, PATCH_MeValidator, PATCH_Me);
UserRouter.get("/:userId", ...DelegatedAuthFlow, GET__UserId);

// Block - Unblock
UserRouter.post("/block", ...DelegatedAuthFlow, POST_BlockValidator, POST_Block);
UserRouter.post("/unblock", ...DelegatedAuthFlow, POST_UnblockValidator, POST_Unblock);

export default UserRouter;
