import { Logger } from "../../../singleton/logger";
const log = Logger.getLogger().child({ from: "oauth/authorize.all" });

import { Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { OAuthServer } from "../../../singleton/oauth-server";
import { statusCodes } from "../../../utils/http-status";
import { Configuration } from "../../../singleton/configuration";
import UserModel from "../../../model/mongo/user";
import { isTokenInvalidated } from "../../../utils/session";

function validatePKCEParameters(req: Request) {
  const queryParameters = req.query;
  const bodyParameters = req.body;
  if ("code_challenge" in queryParameters && "code_challenge" in bodyParameters) {
    return { valid: false, error: "Cannot provide `code_challenge` in both query and body" };
  }
  if ("code_challenge_method" in queryParameters && "code_challenge_method" in bodyParameters) {
    return { valid: false, error: "Cannot provide `code_challenge_method` in both query and body" };
  }
  if ("code_challenge" in queryParameters && !("code_challenge_method" in queryParameters)) {
    return { valid: false, error: "Missing `code_challenge_method` in query" };
  }
  if ("code_challenge" in bodyParameters && !("code_challenge_method" in bodyParameters)) {
    return { valid: false, error: "Missing `code_challenge_method` in body" };
  }
  if ("code_challenge_method" in queryParameters && !("code_challenge" in queryParameters)) {
    return { valid: false, error: "Missing `code_challenge` in query" };
  }
  if ("code_challenge_method" in bodyParameters && !("code_challenge" in bodyParameters)) {
    return { valid: false, error: "Missing `code_challenge` in body" };
  }
  if (!("code_challenge" in queryParameters) && !("code_challenge" in bodyParameters)) {
    return { valid: false, error: "Missing `code_challenge`" };
  }
  if (!("code_challenge_method" in queryParameters) && !("code_challenge_method" in bodyParameters)) {
    return { valid: false, error: "Missing `code_challenge_method`" };
  }
  return { valid: true, error: null };
}

async function ALL__Authorize(req: Request, res: Response, next: NextFunction) {
  try {
    if (Configuration.get("oauth.authorization.require-pkce")) {
      const validation = validatePKCEParameters(req);
      if (!validation.valid) {
        return res.status(statusCodes.clientInputError).json({
          error: "invalid_pkce_parameters",
          error_description: validation.error,
        });
      }
    }
    const code = await OAuthServer.server.authorize(new OAuthRequest(req), new OAuthResponse(res), {
      authenticateHandler: {
        handle: async (req: Request) => {
          if (!req.session.user) {
            return null;
          }
          const userId = req.session.user._id;
          const user = await UserModel.findById(userId).lean();
          if (!user) {
            return null;
          }
          const globalLogoutAt = user.globalLogoutAt as unknown as string;
          const currentLoginAt = req.session.loggedInAt as string;
          if (isTokenInvalidated(globalLogoutAt, currentLoginAt)) {
            log.debug("Expired session detected in authorize.");
            req.session.destroy(() => {});
            return null;
          }
          return req.session.user;
        },
      },
    });
    res.locals.oauth = { code: code };
    if (Configuration.get("oauth.authorization.enable-redirect")) {
      const url = new URL(req.query.redirect_uri as string);
      url.searchParams.set("code", code.authorizationCode);
      url.searchParams.set("state", (req.query.state as string) || uuidv4());
      return res.redirect(url.toString());
    } else {
      return res.json({ code: code.authorizationCode, state: (req.query.state as string) || uuidv4() });
    }
  } catch (error: any) {
    let redirectUri;
    try {
      redirectUri = new URL(req.query.redirect_uri as string);
    } catch (error) {
      return res.status(statusCodes.unauthorized).json({ error: "unknown_error", error_description: "Unknown error" });
    }
    redirectUri.searchParams.append("state", req.query.state as string);
    if (!error.name) {
      if (Configuration.get("oauth.authorization.enable-redirect")) {
        redirectUri.searchParams.append("error", "server_error");
        redirectUri.searchParams.append("error_description", "Server error");
        return res.redirect(redirectUri.toString());
      }
      return res.json({ error: "server_error" });
    }
    if (Configuration.get("oauth.authorization.enable-redirect")) {
      redirectUri.searchParams.append("error", error.name);
      redirectUri.searchParams.append("error_description", error.message);
      return res.redirect(redirectUri.toString());
    }
    return res.status(statusCodes.unauthorized).json({ error: error.name, error_description: error.message });
  }
}

export default ALL__Authorize;
