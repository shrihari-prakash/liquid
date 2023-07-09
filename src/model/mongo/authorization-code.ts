import mongoose from "mongoose";
import { Configuration } from "../../singleton/configuration";

const authorizationCodeSchema = {
  authorizationCode: String,
  expiresAt: Date,
  client: Object,
  user: Object,
  codeChallenge: String,
  codeChallengeMethod: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

const schemaInstance = new mongoose.Schema(authorizationCodeSchema);
schemaInstance.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: Configuration.get("oauth.authorization-code-lifetime"),
  }
);
const AuthorizationCodeModel = mongoose.model("authorization-code", schemaInstance);

export default AuthorizationCodeModel;
