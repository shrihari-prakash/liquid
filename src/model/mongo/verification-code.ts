import mongoose, { ObjectId, Schema, Document } from "mongoose";

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
};
const schemaInstance = new mongoose.Schema(verificationCodeSchema),
  verificationCodeModel = mongoose.model("verification-code", schemaInstance);

export interface IVerificationCode extends Document {
  _id: ObjectId;
  belongsTo: ObjectId;
  verificationMethod: string;
  code: string;
}

export default verificationCodeModel;
