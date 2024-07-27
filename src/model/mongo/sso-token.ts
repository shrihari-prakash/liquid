import mongoose, { Schema } from "mongoose";
import { Configuration } from "../../singleton/configuration.js";

const ssoTokenSchema = {
  token: {
    type: "string",
    unique: true,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
};

const schemaInstance = new mongoose.Schema(ssoTokenSchema, {
  timestamps: true,
});
schemaInstance.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: Configuration.get("user.login.sso.token-lifetime"),
  }
);
const SSOTokenModel = mongoose.model("sso-token", schemaInstance);

export default SSOTokenModel;

