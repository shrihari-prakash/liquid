import { Request } from "express";
import { OAuthServer } from "../../../singleton/oauth-server";

function Authorize() {
  return OAuthServer.server.authorize({
    authenticateHandler: {
      handle: (req: Request) => {
        return req.session.user;
      },
    },
  });
}

export default Authorize();
