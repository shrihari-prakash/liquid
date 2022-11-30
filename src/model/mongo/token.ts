import mongoose from "mongoose";

const tokenSchema = {
  accessToken: String,
  accessTokenExpiresAt: Date,
  refreshToken: String,
  refreshTokenExpiresAt: Date,
  client: Object,
  user: Object,
};

const schemaInstance = new mongoose.Schema(tokenSchema),
  TokenModel = mongoose.model("token", schemaInstance);

export default TokenModel;
