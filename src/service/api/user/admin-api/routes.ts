import express from "express";
import { DelegatedAuthFlow } from "../../middleware/authenticate";
import AuthorizeAdmin from "../../middleware/authorize-admin";
import GET_Hello from "./hello";

const AdminApiRouter = express.Router();

AdminApiRouter.get("/hello", ...DelegatedAuthFlow, AuthorizeAdmin, GET_Hello);

export default AdminApiRouter;
