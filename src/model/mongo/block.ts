import mongoose, { Schema } from "mongoose";

const blockSchema = {
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
};

const schemaInstance = new mongoose.Schema(blockSchema, {
    timestamps: true,
  }),
  BlockModel = mongoose.model("block", schemaInstance);

schemaInstance.index({ sourceId: 1, targetId: 1 }, { unique: true });

export default BlockModel;
