import mongoose, { Schema } from "mongoose";

const creditTransactionSchema = {
  sourceType: {
    type: String,
    required: true,
    enum: ["user", "client"],
  },
  sourceId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
};

const creditTransactionInstance = new mongoose.Schema(creditTransactionSchema, {
    timestamps: true,
  }),
  CreditTransactionModel = mongoose.model("credit-transaction", creditTransactionInstance);

export default CreditTransactionModel;
