import mongoose, { Schema } from "mongoose";

const followerSchema = {
  sourceId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  approved: {
    type: Boolean,
    required: true,
    default: true,
  },
};

const schemaInstance = new mongoose.Schema(followerSchema, {
    timestamps: true,
  }),
  FollowModel = mongoose.model("follow", schemaInstance);

schemaInstance.index({ sourceId: 1, targetId: 1 }, { unique: true });

export default FollowModel;
