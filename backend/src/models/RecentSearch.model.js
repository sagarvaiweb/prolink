import { Schema, model } from "mongoose";

const ENTITY_TYPES = ["all", "people", "jobs", "posts", "companies"];

const recentSearchSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  queryKey: {
    type: String,
    required: true,
  },
  entityTypes: {
    type: [
      {
        type: String,
        enum: ENTITY_TYPES,
      },
    ],
    required: true,
    validate: {
      validator: (entityTypes) => entityTypes.length > 0,
      message: "At least one search category is required.",
    },
  },
  searchedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

recentSearchSchema.index({ userId: 1, queryKey: 1 }, { unique: true });
recentSearchSchema.index({ userId: 1, searchedAt: -1 });

export const RecentSearch = model("RecentSearch", recentSearchSchema);
