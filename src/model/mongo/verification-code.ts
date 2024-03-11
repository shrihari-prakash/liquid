import mongoose, { ObjectId, Schema, Document } from "mongoose";
import { Configuration } from "../../singleton/configuration.js";

const verificationCodeSchema = {
  belongsTo: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
  verificationMethod: {
    type: String,
    required: true,
    enum: ["email", "mobile"],
  },
  code: {
    type: String,
    required: true,
  },
  sessionHash: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
};
const schemaInstance = new mongoose.Schema(verificationCodeSchema, {
    timestamps: true,
  }),
  VerificationCodeModel = mongoose.model("verification-code", schemaInstance);

schemaInstance.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: Configuration.get("user.account-creation.verificaton-code-lifetime"),
  }
);

export interface VerificationCodeInterface extends Document {
  _id: ObjectId;
  belongsTo: ObjectId;
  verificationMethod: string;
  code: string;
  sessionHash?: string;
  type: string;
}

export default VerificationCodeModel;
