import express from "express";

import ALL__Token from "./token.all";
import ALL__Authorize from "./authorize.all";

const OAuthRouter = express.Router();

OAuthRouter.all("/token", ALL__Token);
OAuthRouter.all("/authorize", ALL__Authorize);

export default OAuthRouter;
