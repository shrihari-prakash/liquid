import { Request, Response } from "express";
import { OAuthServer } from "../../../singleton/oauth-server";
import { Request as OAuthRequest, Response as OAuthResponse } from '@node-oauth/oauth2-server';

async function ALL__Authorize(req: Request, res: Response) {
  const redirectUrlAndAuthCode = await OAuthServer.server.authorize(
    new OAuthRequest(req),
    new OAuthResponse(res),
    {
      authenticateHandler: {
        handle: (req: Request) => {
          return req.session.user;
        },
      },
    });
  return res.json({ redirectUrlAndAuthCode });
}

export default ALL__Authorize;
