import mongoose from "mongoose";
import { Configuration } from "../../singleton/configuration";

const tokenSchema = {
  accessToken: String,
  accessTokenExpiresAt: Date,
  refreshToken: String,
  refreshTokenExpiresAt: Date,
  client: Object,
  user: Object,
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

const schemaInstance = new mongoose.Schema(tokenSchema);
schemaInstance.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: Configuration.get("oauth.refresh-token-lifetime"),
  }
);
const TokenModel = mongoose.model("token", schemaInstance);

export default TokenModel;
