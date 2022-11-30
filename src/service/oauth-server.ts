import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-service" });

import ExpressOAuthServer from "express-oauth-server";
import OAuthModel from "../model/oauth";

class OAuthServer {
  server: ExpressOAuthServer;
  constructor() {
    log.info("Initializing OAuth server...");
    this.server = new ExpressOAuthServer({
      model: OAuthModel,
    });
  }
}

export default OAuthServer;
