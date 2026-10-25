import mongoose from "mongoose";
import { Follow } from "../../models/Follow.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

const ensureActiveUser = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active");
  }
};

const getActiveUser = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
  })
    .select("_id")
    .lean();

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  return user;
};

const getPagination = ({ page = 1, limit = 10 }) => {
  const currentPage = Number(page);
  const pageSize = Number(limit);

  return {
    page: currentPage,
    limit: pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

export const followUser = async (follower, followingId) => {
  ensureActiveUser(follower);

  if (follower._id.equals(followingId)) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const target = await getActiveUser(followingId);

  try {
    return await Follow.create({
      follower: follower._id,
      following: target._id,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You are already following this user");
    }
    throw error;
  }
};

export const unfollowUser = async (follower, followingId) => {
  ensureActiveUser(follower);
  await getActiveUser(followingId);

  // DELETE is idempotent: repeating an unfollow succeeds without creating an error.
  await Follow.deleteOne({
    follower: follower._id,
    following: followingId,
  });
};

const getFollowList = async (targetId, relationField, relatedUserField, pagination) => {
  const { page, limit, skip } = getPagination(pagination);
  const [result] = await Follow.aggregate([
    { $match: { [relationField]: targetId } },
    {
      $lookup: {
        from: User.collection.name,
        let: { relatedUserId: `$${relatedUserField}` },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$relatedUserId"] },
              accountStatus: "active",
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              username: 1,
              avatar: 1,
              role: 1,
            },
          },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        users: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: "$user._id",
              firstName: "$user.firstName",
              lastName: "$user.lastName",
              username: "$user.username",
              avatar: "$user.avatar",
              role: "$user.role",
              followedAt: "$createdAt",
            },
          },
        ],
      },
    },
  ]);

  const users = result?.users ?? [];
  const total = result?.metadata[0]?.total ?? 0;

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFollowers = async (userId, pagination) => {
  await getActiveUser(userId);
  return getFollowList(
    new mongoose.Types.ObjectId(userId),
    "following",
    "follower",
    pagination
  );
};

export const getFollowing = async (userId, pagination) => {
  await getActiveUser(userId);
  return getFollowList(
    new mongoose.Types.ObjectId(userId),
    "follower",
    "following",
    pagination
  );
};
