import mongoose from "mongoose";
import { Configuration } from "../../singleton/configuration.js";

const authorizationCodeSchema = {
  authorizationCode: String,
  expiresAt: Date,
  client: Object,
  user: Object,
  codeChallenge: String,
  codeChallengeMethod: String,
  scope: Array,
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
