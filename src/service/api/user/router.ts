import { Logger } from "../../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "user-router" });

import express from "express";

import { Configuration } from "../../../singleton/configuration.js";
import { AuthenticateSilent, DelegatedAuthFlow } from "../middleware/authenticate.js";
import ClientApiRouter from "./client-api/routes.js";
import AdminApiRouter from "./admin-api/routes.js";
import POST_Create, { POST_CreateValidator } from "./create.post.js";
import POST_Follow, { POST_FollowValidator } from "./follow.post.js";
import POST_Login, { POST_LoginValidator } from "./login.post.js";
import POST_Unfollow from "./unfollow.post.js";
import POST_Private, { POST_PrivateValidator } from "./private.post.js";
import POST_Search, { POST_SearchValidator } from "./search.post.js";
import POST_ResetPassword, { POST_ResetPasswordValidator } from "./reset-password.post.js";
import POST_Block, { POST_BlockValidator } from "./block.post.js";
import POST_Unblock, { POST_UnblockValidator } from "./unblock.post.js";
import POST_2FA, { POST_2FAValidator } from "./2fa.post.js";
import POST_Do2FA, { POST_Do2FAValidator } from "./do-2fa.post.js";
import GET_Code, { GET_CodeValidator } from "./code.get.js";
import GET_Followers from "./followers.get.js";
import GET_Following from "./following.get.js";
import GET_UserId from "./_userId.get.js";
import GET_Me from "./me.get.js";
import GET_VerifyEmail, { GET_VerifyEmailValidator } from "./verify-email.get.js";
import GET_FollowRequests from "./follow-requests.get.js";
import GET_FollowStatus, { GET_FollowStatusValidator } from "./follow-status.get.js";
import GET_InviteCodes from "./invite-codes.get.js";
import GET_Scopes from "./scopes.get.js";
import GET_SessionState from "./session-state.get.js";
import GET_Logout from "./logout.get.js";
import GET_LogoutAll from "./logout-all.get.js";
import GET_LoginHistory from "./login-history.get.js";
import PATCH_FollowRequest, { PATCH_FollowRequestValidator } from "./follow-request.patch.js";
import PATCH_Me, { PATCH_MeValidator } from "./me.patch.js";
import PATCH_ProfilePicture from "./profile-picture.patch.js";
import DELETE_FollowEntry, { DELETE_FollowEntryValidator } from "./follow-entry.delete.js";
import DELETE_ProfilePicture from "./profile-picture.delete.js";

const UserRouter = express.Router();

//Core
if (Configuration.get("privilege.can-create-account")) {
  UserRouter.post("/create", ...POST_CreateValidator, POST_Create);
}
UserRouter.get("/session-state", GET_SessionState);
UserRouter.post("/login", ...POST_LoginValidator, POST_Login);
UserRouter.get("/login-history", ...DelegatedAuthFlow, GET_LoginHistory);
UserRouter.get("/verify-email", ...GET_VerifyEmailValidator, GET_VerifyEmail);
UserRouter.post("/private", ...DelegatedAuthFlow, ...POST_PrivateValidator, POST_Private);
UserRouter.get("/code", ...GET_CodeValidator, GET_Code);
UserRouter.post("/reset-password", ...POST_ResetPasswordValidator, POST_ResetPassword);
UserRouter.get("/logout", AuthenticateSilent, GET_Logout);
UserRouter.get("/logout-all", AuthenticateSilent, GET_LogoutAll);
UserRouter.get("/scopes", GET_Scopes);

// Search
if (Configuration.get("privilege.can-use-delegated-user-search-api")) {
  UserRouter.post("/search", ...DelegatedAuthFlow, ...POST_SearchValidator, POST_Search);
}

// Invite System
if (Configuration.get("user.account-creation.enable-invite-only")) {
  UserRouter.get("/invite-codes", ...DelegatedAuthFlow, GET_InviteCodes);
}

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
  UserRouter.get("/:userId/following", ...DelegatedAuthFlow, GET_Following);
  UserRouter.get("/:userId/followers", ...DelegatedAuthFlow, GET_Followers);
  UserRouter.get("/follow-requests", ...DelegatedAuthFlow, GET_FollowRequests);
  UserRouter.get("/follow-status", ...DelegatedAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  UserRouter.get("/follow-status/:userId", ...DelegatedAuthFlow, GET_FollowStatusValidator, GET_FollowStatus);
  UserRouter.patch("/follow-request", ...DelegatedAuthFlow, ...PATCH_FollowRequestValidator, PATCH_FollowRequest);
  UserRouter.delete("/follow-entry", ...DelegatedAuthFlow, ...DELETE_FollowEntryValidator, DELETE_FollowEntry);
}

// Application client APIs
UserRouter.use("/client-api", ClientApiRouter);

// Admin APIs
UserRouter.use("/admin-api", AdminApiRouter);

// User info
UserRouter.get("/me", ...DelegatedAuthFlow, GET_Me);
UserRouter.patch("/me", ...DelegatedAuthFlow, PATCH_MeValidator, PATCH_Me);
UserRouter.get("/:userId", ...DelegatedAuthFlow, GET_UserId);
UserRouter.get("/info/:userId", ...DelegatedAuthFlow, GET_UserId);

// Block - Unblock
UserRouter.post("/block", ...DelegatedAuthFlow, POST_BlockValidator, POST_Block);
UserRouter.post("/unblock", ...DelegatedAuthFlow, POST_UnblockValidator, POST_Unblock);

// 2FA
if (Configuration.get("2fa.email.enabled")) {
  UserRouter.post("/2fa", ...DelegatedAuthFlow, POST_2FAValidator, POST_2FA);
  UserRouter.post("/do-2fa", POST_Do2FAValidator, POST_Do2FA);
}

export default UserRouter;
