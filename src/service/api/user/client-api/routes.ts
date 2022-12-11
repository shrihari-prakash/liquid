import express from "express";

import { ClientAuthFlow } from "../../middleware/authenticate";
import GetUserInfo from "./get-user-info";

const ClientApiRouter = express.Router();

ClientApiRouter.post("/get-user-info", ...ClientAuthFlow, GetUserInfo);

export default ClientApiRouter;
