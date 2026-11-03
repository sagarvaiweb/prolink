import { Schema, model } from "mongoose";

const savedJobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });
savedJobSchema.index({ user: 1, createdAt: -1 });

export const SavedJob = model("SavedJob", savedJobSchema);
