import { Profile } from "../../models/Profile.model.js";
import { ProfileView } from "../../models/ProfileView.model.js";
import { Post } from "../../models/Post.model.js";
import { Connection } from "../../models/Connection.model.js";
import { Follow } from "../../models/Follow.model.js";
import { Application } from "../../models/Application.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUSES = ["applied", "shortlisted", "rejected", "hired"];

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const getRangeBounds = (range, user) => {
  const end = new Date();
  const endExclusive = new Date(startOfUtcDay(end).getTime() + DAY_MS);
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  const start = days
    ? new Date(endExclusive.getTime() - days * DAY_MS)
    : startOfUtcDay(user.createdAt ?? end);
  return { start, endExclusive };
};

const makeDailySeries = (bounds, rows, mapRow) => {
  const countsByDay = new Map(rows.map((row) => [row._id, mapRow(row)]));
  const emptyDay = mapRow({});
  const series = [];
  for (let cursor = new Date(bounds.start); cursor < bounds.endExclusive; cursor = new Date(cursor.getTime() + DAY_MS)) {
    const date = cursor.toISOString().slice(0, 10);
    series.push({ date, ...(countsByDay.get(date) ?? emptyDay) });
  }
  return series;
};

const dayGroup = (field) => ({
  $dateToString: { format: "%Y-%m-%d", date: field, timezone: "UTC" },
});

export const getProfileViewStats = async (user, range) => {
  const profile = await Profile.findOne({ user: user._id }).select("_id viewCount").lean();
  if (!profile) return { total: 0, series: [] };

  const bounds = getRangeBounds(range, user);
  const rows = await ProfileView.aggregate([
    { $match: { profile: profile._id, viewedAt: { $gte: bounds.start, $lt: bounds.endExclusive } } },
    { $group: { _id: dayGroup("$viewedAt"), count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return {
    total: rows.reduce((sum, row) => sum + row.count, 0),
    allTimeTotal: profile.viewCount ?? 0,
    series: makeDailySeries(bounds, rows, (row) => ({ count: row.count ?? 0 })),
  };
};

export const getPostEngagementStats = async (user, range) => {
  const bounds = getRangeBounds(range, user);
  const rows = await Post.aggregate([
    { $match: { author: user._id, createdAt: { $gte: bounds.start, $lt: bounds.endExclusive } } },
    {
      $group: {
        _id: dayGroup("$createdAt"),
        posts: { $sum: 1 },
        likes: { $sum: "$likeCount" },
        comments: { $sum: "$commentCount" },
        shares: { $sum: "$shareCount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const totals = rows.reduce(
    (result, row) => ({
      posts: result.posts + row.posts,
      likes: result.likes + row.likes,
      comments: result.comments + row.comments,
      shares: result.shares + row.shares,
    }),
    { posts: 0, likes: 0, comments: 0, shares: 0 }
  );
  return {
    totals,
    series: makeDailySeries(bounds, rows, ({ posts = 0, likes = 0, comments = 0, shares = 0 }) => ({ posts, likes, comments, shares })),
  };
};

export const getNetworkGrowthStats = async (user, range) => {
  const bounds = getRangeBounds(range, user);
  const [connectionRows, followerRows, connectionTotal, followerTotal] = await Promise.all([
    Connection.aggregate([
      { $match: { status: "accepted", respondedAt: { $gte: bounds.start, $lt: bounds.endExclusive }, $or: [{ requester: user._id }, { recipient: user._id }] } },
      { $group: { _id: dayGroup("$respondedAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Follow.aggregate([
      { $match: { following: user._id, createdAt: { $gte: bounds.start, $lt: bounds.endExclusive } } },
      { $group: { _id: dayGroup("$createdAt"), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Connection.countDocuments({ status: "accepted", $or: [{ requester: user._id }, { recipient: user._id }] }),
    Follow.countDocuments({ following: user._id }),
  ]);

  const connections = makeDailySeries(bounds, connectionRows, (row) => ({ connections: row.count ?? 0 }));
  const followers = makeDailySeries(bounds, followerRows, (row) => ({ followers: row.count ?? 0 }));
  const followerByDay = new Map(followers.map((row) => [row.date, row.followers]));
  return {
    totals: { connections: connectionTotal, followers: followerTotal },
    series: connections.map((row) => ({ ...row, followers: followerByDay.get(row.date) ?? 0 })),
  };
};

export const getApplicationsSummary = async (user) => {
  const rows = await Application.aggregate([
    { $match: { applicant: user._id } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of rows) if (STATUSES.includes(row._id)) byStatus[row._id] = row.count;
  return { total: Object.values(byStatus).reduce((sum, count) => sum + count, 0), byStatus };
};
