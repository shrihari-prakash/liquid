import mongoose from "mongoose";

const clientSchema = {
  clientId: String,
  clientSecret: String,
  clientName: String,
  role: String,
  grants: [String],
  redirectUris: [String],
};

const schemaInstance = new mongoose.Schema(clientSchema),
  ClientModel = mongoose.model("client", schemaInstance);

export default ClientModel;
