import mongoose, { Schema } from "mongoose";

const inviteCodeSchema = {
  code: {
    type: "string",
    unique: true,
    required: true,
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
};

const schemaInstance = new mongoose.Schema(inviteCodeSchema, {
    timestamps: true,
  }),
  InviteCodeModel = mongoose.model("invite-code", schemaInstance);

schemaInstance.index({ sourceId: 1, targetId: 1 }, { unique: true });

export default InviteCodeModel;
