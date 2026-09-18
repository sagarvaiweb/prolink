import mongoose, { Schema } from "mongoose";

const followSchema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// A user cannot create a follow relationship with themselves.
followSchema.pre("validate", function () {
  if (this.follower && this.following && this.follower.equals(this.following)) {
    this.invalidate("following", "A user cannot follow themselves.");
  }
});

// Each directional follow relationship may exist only once.
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = mongoose.model("Follow", followSchema);
