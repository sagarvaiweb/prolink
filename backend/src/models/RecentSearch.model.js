import { Schema, model } from "mongoose";

const recentSearchSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  query: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, enum: ["people", "jobs", "posts", "companies", "all"], default: "all" },
}, { timestamps: { createdAt: true, updatedAt: false } });

recentSearchSchema.index({ user: 1, createdAt: -1 });
export const RecentSearch = model("RecentSearch", recentSearchSchema);
