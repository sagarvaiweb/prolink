import { User } from "../../models/User.model.js";
import { Post } from "../../models/Post.model.js";
import { Job } from "../../models/Job.model.js";
import { DailyStatSnapshot } from "../../models/DailyStatSnapshot.model.js";

const utcDayStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const createDailySnapshot = async (date = new Date()) => {
  const dayStart = utcDayStart(date);
  const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [totalUsers, newUsersToday, totalPosts, totalJobs, activeUsersToday] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: dayStart, $lt: nextDay } }),
      Post.countDocuments(),
      Job.countDocuments(),
      // lastLogin is the platform's available activity signal. A dedicated
      // activity event stream can replace this when the app tracks all actions.
      User.countDocuments({ lastLogin: { $gte: dayStart, $lt: nextDay } }),
    ]);

  return DailyStatSnapshot.findOneAndUpdate(
    { date: dayStart },
    { $set: { totalUsers, newUsersToday, totalPosts, totalJobs, activeUsersToday } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
};

export const scheduleDailySnapshot = () => {
  const runAndSchedule = async () => {
    try {
      // Capture the completed day after UTC midnight.
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await createDailySnapshot(yesterday);
      console.info("Daily dashboard snapshot updated.");
    } catch (error) {
      console.error("Daily dashboard snapshot failed:", error);
    } finally {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
      ));
      setTimeout(runAndSchedule, Math.max(1, nextMidnight.getTime() - Date.now())).unref?.();
    }
  };

  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  setTimeout(runAndSchedule, Math.max(1, nextMidnight.getTime() - Date.now())).unref?.();
};
