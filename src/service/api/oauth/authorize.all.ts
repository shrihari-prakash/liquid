import { Request as OAuthRequest, Response as OAuthResponse } from "@node-oauth/oauth2-server";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

import { OAuthServer } from "../../../singleton/oauth-server";
import { statusCodes } from "../../../utils/http-status";
import { Configuration } from "../../../singleton/configuration";

function validatePKCEParameters(req: Request) {
  const queryParameters = req.query;
  const bodyParameters = req.body;
  if ("code_challenge" in queryParameters && "code_challenge" in bodyParameters) {
    return { valid: false, error: "Cannot provide 'code_challenge' in both query and body." };
  }
  if ("code_challenge_method" in queryParameters && "code_challenge_method" in bodyParameters) {
    return { valid: false, error: "Cannot provide 'code_challenge_method' in both query and body." };
  }
  if ("code_challenge" in queryParameters && !("code_challenge_method" in queryParameters)) {
    return {
      valid: false,
      error: "If providing 'code_challenge', 'code_challenge_method' must also be provided in query.",
    };
  }
  if ("code_challenge" in bodyParameters && !("code_challenge_method" in bodyParameters)) {
    return {
      valid: false,
      error: "If providing 'code_challenge', 'code_challenge_method' must also be provided in body.",
    };
  }
  if ("code_challenge_method" in queryParameters && !("code_challenge" in queryParameters)) {
    return {
      valid: false,
      error: "Cannot provide 'code_challenge_method' without providing 'code_challenge' in query.",
    };
  }
  if ("code_challenge_method" in bodyParameters && !("code_challenge" in bodyParameters)) {
    return {
      valid: false,
      error: "Cannot provide 'code_challenge_method' without providing 'code_challenge' in body.",
    };
  }

  // Check if neither code_challenge nor code_challenge_method is provided
  if (!("code_challenge" in queryParameters) && !("code_challenge" in bodyParameters)) {
    return { valid: false, error: "'code_challenge' must be provided in either query or body." };
  }

  return { valid: true, error: null };
}

async function ALL__Authorize(req: Request, res: Response, next: NextFunction) {
  try {
    if (Configuration.get("oauth.authorization.require-pkce")) {
      const validation = validatePKCEParameters(req);
      if (!validation.valid) {
        return res.status(statusCodes.clientInputError).json({
          error: "invalid_pkce_request",
          error_description: validation.error,
        });
      }
    }
    const code = await OAuthServer.server.authorize(new OAuthRequest(req), new OAuthResponse(res), {
      authenticateHandler: {
        handle: (req: Request) => {
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
    if (!error.name) {
      return res.json({ error: "unknown_error" });
    }
    res.status(statusCodes.unauthorized).json({ error: error.name, error_description: error.message });
  }
}

export default ALL__Authorize;
