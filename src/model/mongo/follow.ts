import mongoose, { Schema } from "mongoose";

const sollowSchema = {
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
};

const schemaInstance = new mongoose.Schema(sollowSchema),
  FollowModel = mongoose.model("follow", schemaInstance);

export default FollowModel;
