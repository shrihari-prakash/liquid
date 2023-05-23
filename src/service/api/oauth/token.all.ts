import { Request, Response } from "express";
import { OAuthServer } from "../../../singleton/oauth-server";
import { Request as OAuthRequest, Response as OAuthResponse } from '@node-oauth/oauth2-server';

const oauthOptions = {
  requireClientAuthentication: {
    authorization_code: false,
    refresh_token: false,
  },
};

async function ALL__Token(req: Request, res: Response) {
  const token = await OAuthServer.server.token(
    new OAuthRequest(req),
    new OAuthResponse(res),
    oauthOptions
  );

  console.log(token);
}

export default ALL__Token;
