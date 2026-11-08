import { Schema, model } from "mongoose";

const profileViewSchema = new Schema(
  {
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    // Viewer identity is retained internally for deduplication/analytics only;
    // dashboard responses will expose aggregate counts, never this field.
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { versionKey: false }
);

profileViewSchema.index({ profile: 1, viewedAt: -1 });

export const ProfileView = model("ProfileView", profileViewSchema);
