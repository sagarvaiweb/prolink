import { Schema, model } from "mongoose";

const jobViewSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
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

jobViewSchema.index({ job: 1, viewedAt: -1 });

export const JobView = model("JobView", jobViewSchema);
