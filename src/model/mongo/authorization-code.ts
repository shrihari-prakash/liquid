import mongoose from "mongoose";

const authorizationCodeSchema = {
  authorizationCode: String,
  expiresAt: Date,
  client: Object,
  user: Object,
};

const schemaInstance = new mongoose.Schema(authorizationCodeSchema),
  AuthorizationCodeModel = mongoose.model("authorization-code", schemaInstance);

export default AuthorizationCodeModel;
