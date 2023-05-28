import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-service" });

import ExpressOAuthServer from "@node-oauth/express-oauth-server";
import OAuthModel from "../model/oauth";
import { Configuration } from "../singleton/configuration";

class OAuthServer {
  server: ExpressOAuthServer;
  constructor() {
    log.info("Initializing OAuth server...");
    this.server = new ExpressOAuthServer({
      model: OAuthModel,
      authorizationCodeLifetime: Configuration.get("oauth.authorization-code-lifetime") as number,
      accessTokenLifetime: Configuration.get("oauth.access-token-lifetime") as number,
      refreshTokenLifetime: Configuration.get("oauth.refresh-token-lifetime") as number,
    });
  }
}

export default OAuthServer;
