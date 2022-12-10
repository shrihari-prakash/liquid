import express from "express";
import AuthFlow from "../middleware/authenticate";
import Create, { CreateValidator } from "./create";
import Follow, { FollowValidator } from "./follow";
import Followers from "./followers";
import Login, { LoginValidator } from "./login";
import Me from "./me";
import Unfollow from "./unfollow";
import VerifyEmail, { VerifyEmailValidator } from "./verify-email";

const UserRouter = express.Router();

UserRouter.post("/create", ...CreateValidator, Create);
UserRouter.post("/login", ...LoginValidator, Login);
UserRouter.get("/verify-email", ...VerifyEmailValidator, VerifyEmail);
UserRouter.get("/me", ...AuthFlow, Me);
UserRouter.get("/followers", ...AuthFlow, Followers);
UserRouter.post("/follow", ...AuthFlow, ...FollowValidator, Follow);
UserRouter.post("/unfollow", ...AuthFlow, ...FollowValidator, Unfollow);

export default UserRouter;
