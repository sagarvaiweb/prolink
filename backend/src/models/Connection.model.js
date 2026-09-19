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
      enum: ["pending", "accepted", "rejected", "cancelled"],
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

// Prevents concurrent duplicate requests in the same direction while allowing
// a new request after a prior request was rejected or cancelled.
connectionSchema.index(
  { requester: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "accepted"] } },
  }
);

export const Connection = mongoose.model("Connection", connectionSchema);
