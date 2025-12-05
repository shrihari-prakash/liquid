import mongoose from "mongoose";

export const clientSchema = {
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
    default: ["delegated:all"],
  },
  grants: [String],
  redirectUris: [String],
};

export interface ClientInterface {
  id: string;
  secret: string;
  displayName: string;
  role: string;
  scope: string;
  grants: string | string[];
  redirectUris?: string[];
  accessTokenLifetime?: number | undefined;
  refreshTokenLifetime?: number | undefined;
  [key: string]: any;
}

const schemaInstance = new mongoose.Schema(clientSchema),
  ClientModel = mongoose.models.client || mongoose.model("client", schemaInstance);

export default ClientModel;

