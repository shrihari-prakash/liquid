import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-service" });

import ExpressOAuthServer from "express-oauth-server";
import OAuthModel from "../model/oauth";
import { Configuration } from "../singleton/configuration";

class OAuthServer {
  server: ExpressOAuthServer;
  constructor() {
    log.info("Initializing OAuth server...");
    this.server = new ExpressOAuthServer({
      model: OAuthModel,
      authorizationCodeLifetime: Configuration.get(
        "authorization-code-lifetime"
      ) as number,
      accessTokenLifetime: Configuration.get("access-token-lifetime") as number,
      refreshTokenLifetime: Configuration.get(
        "refresh-token-lifetime"
      ) as number,
    });
  }
}

export default OAuthServer;
