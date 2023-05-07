import { OAuthServer } from "../../../singleton/oauth-server";

const oauthOptions = {
  requireClientAuthentication: {
    authorization_code: false,
    refresh_token: false,
  },
};

function ALL__Token() {
  return OAuthServer.server.token(oauthOptions);
}

export default ALL__Token();
