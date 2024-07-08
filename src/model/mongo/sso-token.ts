import mongoose, { Schema } from "mongoose";

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
  }),
  SSOTokenModel = mongoose.model("sso-token", schemaInstance);

export default SSOTokenModel;
