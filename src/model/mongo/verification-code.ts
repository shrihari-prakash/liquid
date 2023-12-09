import mongoose, { ObjectId, Schema, Document } from "mongoose";
import { Configuration } from "../../singleton/configuration";

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
}

export default VerificationCodeModel;
