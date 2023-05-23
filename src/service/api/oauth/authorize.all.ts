import { Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { OAuthServer } from "../../../singleton/oauth-server";
import { statusCodes } from "../../../utils/http-status";
import { Configuration } from "../../../singleton/configuration";

async function ALL__Authorize(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await OAuthServer.server.authorize(new OAuthRequest(req), new OAuthResponse(res), {
      authenticateHandler: {
        handle: (req: Request) => {
          return req.session.user;
        },
      },
    });
    if (Configuration.get("oauth.authorization.enable-redirect")) {
      const url = new URL(req.query.redirect_uri as string);
      url.searchParams.set("code", response.authorizationCode);
      url.searchParams.set("state", (req.query.state as string) || uuidv4());
      return res.redirect(url.toString());
    } else {
      return res.json({ code: response.authorizationCode, state: (req.query.state as string) || uuidv4() });
    }
  } catch (error: any) {
    if (!error.name) {
      return res.json({ error: "unknown_error" });
    }
    res.status(statusCodes.unauthorized).json({ error: error.name, error_description: error.message });
  }
}

export default ALL__Authorize;
