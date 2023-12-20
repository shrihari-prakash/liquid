import mongoose, { ObjectId, Schema } from "mongoose";

const loginHistorySchema = {
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  success: {
    type: Boolean,
    required: true,
  },
  reason: {
    type: String,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
};

const loginHistoryInstance = new mongoose.Schema(loginHistorySchema, {
    timestamps: true,
  }),
  LoginHistoryModel = mongoose.model("login-history", loginHistoryInstance);

export default LoginHistoryModel;

export type LoginHistoryInterface = {
  userAgent?: string;
  ipAddress?: string;
  success?: boolean;
  reason?: string;
  targetId: string | ObjectId;
};
