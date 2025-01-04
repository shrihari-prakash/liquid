import mongoose from "mongoose";

const roleSchema = {
  id: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  ranking: {
    type: Number,
    required: true,
  },
  scope: {
    type: Array,
    required: true,
    default: [],
  },
  type: {
    type: String,
    required: true,
    enum: ["user", "client"],
  },
  description: String,
};

const schemaInstance = new mongoose.Schema(roleSchema, {
    timestamps: true,
  }),
  RoleModel = mongoose.model("role", schemaInstance);

export type RoleInterface = {
  id: string;
  displayName: string;
  ranking: number;
  scope: string[];
  type: "user" | "client";
  description?: string | null;
};

export default RoleModel;

