import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import AuthorizeAdmin from "../../middleware/authorize-admin";
import POST_Access, { POST_AccessValidator } from "./access.post";
import GET_Hello from "./hello.get";

const AdminApiRouter = express.Router();

AdminApiRouter.get("/hello", ...DelegatedAuthFlow, AuthorizeAdmin, GET_Hello);
AdminApiRouter.post(
  "/access",
  ...DelegatedAuthFlow,
  AuthorizeAdmin,
  POST_AccessValidator,
  POST_Access
);

export default AdminApiRouter;
