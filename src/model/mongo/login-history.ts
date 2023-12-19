import mongoose, { Schema } from "mongoose";

const loginHistorySchema = {
  userAgent: {
    type: String,
  },
  ipAddress: {
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
