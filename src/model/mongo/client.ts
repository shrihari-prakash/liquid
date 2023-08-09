import mongoose from "mongoose";

const clientSchema = {
  id: {
    type: String,
    required: true,
    unique: true,
  },
  secret: String,
  displayName: String,
  role: String,
  scope: {
    type: Array,
    required: true,
    default: ["user.delegated.all"],
  },
  grants: [String],
  redirectUris: [String],
};

const schemaInstance = new mongoose.Schema(clientSchema),
  ClientModel = mongoose.model("client", schemaInstance);

export default ClientModel;
