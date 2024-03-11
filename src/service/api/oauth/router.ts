import express from "express";

import { ClientAuthFlow } from "../middleware/authenticate.js";
import ALL__Token from "./token.all.js";
import ALL__Authorize from "./authorize.all.js";
import ALL_Introspect from "./introspect.js";

const OAuthRouter = express.Router();

OAuthRouter.all("/token", ALL__Token);
OAuthRouter.all("/authorize", ALL__Authorize);
OAuthRouter.all("/introspect", ...ClientAuthFlow, ALL_Introspect);

export default OAuthRouter;
