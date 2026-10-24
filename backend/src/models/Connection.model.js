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
    pairKey: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, connection) {
        delete connection.pairKey;
        return connection;
      },
    },
  }
);

connectionSchema.pre("validate", function () {
  if (this.requester && this.recipient) {
    this.pairKey = [String(this.requester), String(this.recipient)].sort().join(":");
  }
});

connectionSchema.index({ pairKey: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1, createdAt: -1 });
connectionSchema.index({ requester: 1, status: 1, createdAt: -1 });

export const Connection = mongoose.model("Connection", connectionSchema);
