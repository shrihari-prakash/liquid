import express from "express";

import { ClientAuthFlow } from "../middleware/authenticate";
import ALL__Token from "./token.all";
import ALL__Authorize from "./authorize.all";
import ALL_Introspect from "./introspect";

const OAuthRouter = express.Router();

OAuthRouter.all("/token", ALL__Token);
OAuthRouter.all("/authorize", ALL__Authorize);
OAuthRouter.all("/introspect", ...ClientAuthFlow, ALL_Introspect);

export default OAuthRouter;
