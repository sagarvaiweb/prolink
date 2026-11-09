import { Schema, model } from "mongoose";

const dailyStatSnapshotSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalUsers: {
      type: Number,
      required: true,
      min: 0,
    },
    newUsersToday: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPosts: {
      type: Number,
      required: true,
      min: 0,
    },
    totalJobs: {
      type: Number,
      required: true,
      min: 0,
    },
    activeUsersToday: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export const DailyStatSnapshot = model("DailyStatSnapshot", dailyStatSnapshotSchema);
