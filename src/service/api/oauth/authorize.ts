import { Request } from "express";
import { OAuthServer } from "../../../singleton/oauth-server";

function Authorize() {
  return OAuthServer.server.authorize({
    authenticateHandler: {
      handle: (req: Request) => {
        console.log(req.session);
        return req.session.user;
      },
    },
  });
}

export default Authorize();
