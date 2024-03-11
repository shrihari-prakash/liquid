import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "oauth-service" });

import OAuth2Server from '@node-oauth/oauth2-server';

import OAuthModel from "../../model/oauth/oauth.js";
import { Configuration } from "../../singleton/configuration.js";

class OAuthServer {
  server: OAuth2Server;
  constructor() {
    log.info("Initializing OAuth server...");
    this.server = new OAuth2Server({
      model: OAuthModel,
      authorizationCodeLifetime: Configuration.get("oauth.authorization-code-lifetime") as number,
      accessTokenLifetime: Configuration.get("oauth.access-token-lifetime") as number,
      refreshTokenLifetime: Configuration.get("oauth.refresh-token-lifetime") as number,
    });
  }
}

export default OAuthServer;
