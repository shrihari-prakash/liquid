import { Logger } from "../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth-service" });

import ExpressOAuthServer, { UnauthorizedRequestError } from '@node-oauth/oauth2-server';
import { NextFunction, Request, Response } from "express";

import OAuthModel from "../model/oauth";
import { Configuration } from "../singleton/configuration";
import { ErrorResponse } from "../utils/response";

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

  public handleResponse = function (_: Request, res: Response, response: any) {
    if (response.status === 302) {
      var location = response.headers.location;
      delete response.headers.location;
      res.set(response.headers);
      res.redirect(location);
    } else {
      res.set(response.headers);
      res.status(response.status).send(response.body);
    }
  };

  public handleError = function (e: any, _: Request, res: Response, response: any, next: NextFunction) {
    if (response) {
      res.set(response.headers);
    }
    res.status(e.code);
    if (e instanceof UnauthorizedRequestError) {
      return res.send();
    }
    res.send(new ErrorResponse(e.name, { errorDescription: e.message }));
  }
}

export default OAuthServer;
