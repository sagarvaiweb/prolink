import mongoose, { Schema } from "mongoose";

const connectionSchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      required: true,
      default: "pending",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Supports request inbox and sent-request queries, including status filtering.
connectionSchema.index({ requester: 1, status: 1, createdAt: -1 });
connectionSchema.index({ recipient: 1, status: 1, createdAt: -1 });

export const Connection = mongoose.model("Connection", connectionSchema);
