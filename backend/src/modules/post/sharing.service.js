import mongoose from "mongoose";
import { Connection } from "../../models/Connection.model.js";
import { Like } from "../../models/Like.model.js";
import { Post } from "../../models/Post.model.js";
import { SavedPost } from "../../models/SavedPost.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import { getPostById } from "./post.service.js";

const AUTHOR_FIELDS = "firstName lastName username avatar role";

const ensureActiveUser = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active");
  }
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

const getConnectionIds = async (userId) => {
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .select("requester recipient")
    .lean();

  return connections.map((connection) =>
    String(connection.requester) === String(userId)
      ? connection.recipient
      : connection.requester
  );
};

export const sharePost = async (user, postId, shareData) => {
  const sourcePost = await getPostById(user, postId);
  const originalPostId =
    sourcePost.originalPost?._id ?? sourcePost.originalPost ?? sourcePost._id;
  const originalPost = await Post.findById(originalPostId).select("visibility");
  if (!originalPost) {
    throw new ApiError(404, "Post not found.");
  }
  if (originalPost.visibility !== "public") {
    throw new ApiError(403, "Connection-only posts cannot be reshared.");
  }

  const repost = await Post.create({
    author: user._id,
    content: shareData.content,
    visibility: shareData.visibility,
    originalPost: originalPostId,
  });

  try {
    const updatedOriginal = await Post.findOneAndUpdate(
      { _id: originalPostId },
      { $inc: { shareCount: 1 } },
      { new: true, projection: { _id: 1 } }
    ).lean();

    if (!updatedOriginal) {
      await repost.deleteOne();
      throw new ApiError(404, "Post not found.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    try {
      await repost.deleteOne();
    } catch (cleanupError) {
      console.error("Failed to remove repost after counter update failed.", cleanupError);
    }
    throw error;
  }

  await repost.populate([
    { path: "author", select: AUTHOR_FIELDS },
    { path: "originalPost", populate: { path: "author", select: AUTHOR_FIELDS } },
  ]);
  return { ...repost.toObject(), isLiked: false, isSaved: false };
};

export const savePost = async (user, postId) => {
  ensureActiveUser(user);
  const post = await getPostById(user, postId);
  try {
    await SavedPost.create({ user: user._id, post: post._id });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You already saved this post.");
    }
    throw error;
  }
  return { postId: String(post._id), isSaved: true };
};

export const unsavePost = async (user, postId) => {
  ensureActiveUser(user);
  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, "Invalid post ID.");
  }
  const post = await Post.findById(postId).select("_id");
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }
  await SavedPost.deleteOne({ user: user._id, post: post._id });
  return { postId: String(post._id), isSaved: false };
};

export const getSavedPosts = async (user, pagination) => {
  ensureActiveUser(user);
  const { page, limit, skip } = getPagination(pagination);
  const connectionIds = await getConnectionIds(user._id);
  const allowedConnectionAuthorIds = [
    user._id,
    ...connectionIds,
  ].map((id) => new mongoose.Types.ObjectId(id));

  const [result] = await SavedPost.aggregate([
    { $match: { user: user._id } },
    {
      $lookup: {
        from: Post.collection.name,
        localField: "post",
        foreignField: "_id",
        as: "savedPost",
      },
    },
    { $unwind: "$savedPost" },
    {
      $match: {
        $or: [
          { "savedPost.visibility": "public" },
          {
            "savedPost.visibility": "connections",
            "savedPost.author": { $in: allowedConnectionAuthorIds },
          },
        ],
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        let: { authorId: "$savedPost.author" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$authorId"] },
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
        as: "author",
      },
    },
    { $unwind: "$author" },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        posts: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: "$savedPost._id",
              author: "$author",
              content: "$savedPost.content",
              mediaUrls: "$savedPost.mediaUrls",
              visibility: "$savedPost.visibility",
              likeCount: "$savedPost.likeCount",
              commentCount: "$savedPost.commentCount",
              shareCount: "$savedPost.shareCount",
              isEdited: "$savedPost.isEdited",
              originalPost: "$savedPost.originalPost",
              createdAt: "$savedPost.createdAt",
              updatedAt: "$savedPost.updatedAt",
              savedAt: "$createdAt",
            },
          },
        ],
      },
    },
  ]);
  const posts = result?.posts ?? [];
  const total = result?.metadata[0]?.total ?? 0;
  await Post.populate(posts, {
    path: "originalPost",
    populate: { path: "author", select: AUTHOR_FIELDS },
  });
  const savedPostIds = posts.map((post) => post._id);
  const likedPostIds = new Set(
    savedPostIds.length
      ? (
          await Like.find({
            user: user._id,
            post: { $in: savedPostIds },
          })
            .select("post")
            .lean()
        ).map((like) => String(like.post))
      : []
  );

  return {
    posts: posts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(String(post._id)),
      isSaved: true,
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
