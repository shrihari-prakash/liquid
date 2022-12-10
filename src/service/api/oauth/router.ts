import express from "express";
import { OAuthServer } from "../../../singleton/oauth-server";
import Authorize from "./authorize";

const OAuthRouter = express.Router();

const oauthOptions = {
  requireClientAuthentication: {
    authorization_code: false,
    refresh_token: false,
  },
};
OAuthRouter.all("/token", OAuthServer.server.token(oauthOptions));

OAuthRouter.all("/authorize", Authorize);

OAuthRouter.get("/", OAuthServer.server.authenticate(), function (req, res) {
  res.send("Congratulations, you are in a secret area!");
});

export default OAuthRouter;
