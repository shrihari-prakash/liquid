import mongoose, { ObjectId, Schema } from "mongoose";
import { Configuration } from "../../singleton/configuration";

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

const schemaInstance = new mongoose.Schema(loginHistorySchema, {
  timestamps: true,
});

schemaInstance.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: Configuration.get("user.login.history-record-expires-in"),
  }
);

const LoginHistoryModel = mongoose.model("login-history", schemaInstance);

export default LoginHistoryModel;

export type LoginHistoryInterface = {
  userAgent?: string;
  ipAddress?: string;
  success?: boolean;
  reason?: string;
  targetId: string | ObjectId;
};
