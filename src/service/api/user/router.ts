import express from "express";
import Create, { CreateValidator } from "./create";
import Login, { LoginValidator } from "./login";
import VerifyEmail, { VerifyEmailValidator } from "./verify-email";

const UserRouter = express.Router();

UserRouter.post("/create", ...CreateValidator, Create);
UserRouter.post("/login", ...LoginValidator, Login);
UserRouter.get("/verify-email", ...VerifyEmailValidator, VerifyEmail);

export default UserRouter;
