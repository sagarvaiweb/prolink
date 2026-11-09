import { DailyStatSnapshot } from "../../models/DailyStatSnapshot.model.js";
import ApiError from "../../utils/ApiError.js";
import { createDailySnapshot } from "./snapshot.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const getPlatformStats = async (admin, range) => {
  if (admin.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }

  const today = startOfUtcDay(new Date());
  const todaySnapshot = await createDailySnapshot(today);
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  let start;

  if (days) {
    start = new Date(today.getTime() - (days - 1) * DAY_MS);
  } else {
    const earliestSnapshot = await DailyStatSnapshot.findOne()
      .sort({ date: 1 })
      .select("date")
      .lean();
    start = earliestSnapshot?.date ?? today;
  }

  const snapshots = await DailyStatSnapshot.find({
    date: { $gte: start, $lte: today },
  })
    .select("date totalUsers newUsersToday totalPosts totalJobs activeUsersToday")
    .sort({ date: 1 })
    .lean();

  return {
    totals: {
      users: todaySnapshot.totalUsers,
      posts: todaySnapshot.totalPosts,
      jobs: todaySnapshot.totalJobs,
      activeUsersToday: todaySnapshot.activeUsersToday,
    },
    range,
    series: snapshots.map((snapshot) => ({
      date: snapshot.date.toISOString().slice(0, 10),
      totalUsers: snapshot.totalUsers,
      newUsers: snapshot.newUsersToday,
      totalPosts: snapshot.totalPosts,
      totalJobs: snapshot.totalJobs,
      activeUsers: snapshot.activeUsersToday,
    })),
  };
};
