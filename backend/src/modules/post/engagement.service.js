import { Comment } from "../../models/Comment.model.js";
import { Like } from "../../models/Like.model.js";
import { Post } from "../../models/Post.model.js";
import ApiError from "../../utils/ApiError.js";
import { notifyPostComment, notifyPostLike } from "../notification/notification.service.js";
import { getPostById } from "./post.service.js";

const AUTHOR_FIELDS = "firstName lastName username avatar role";

const getPagination = ({ page = 1, limit = 10 }) => {
  const currentPage = Number(page);
  const pageSize = Number(limit);

  return {
    page: currentPage,
    limit: pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

export const likePost = async (user, postId) => {
  const post = await getPostById(user, postId);

  try {
    await Like.create({ post: post._id, user: user._id });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You already liked this post.");
    }
    throw error;
  }

  let updatedPost;
  try {
    updatedPost = await Post.findOneAndUpdate(
      { _id: post._id },
      { $inc: { likeCount: 1 } },
      { returnDocument: "after", projection: { likeCount: 1 } }
    ).lean();
  } catch (error) {
    try {
      await Like.deleteOne({ post: post._id, user: user._id });
    } catch (cleanupError) {
      console.error(
        "Failed to roll back a like after counter update failed.",
        cleanupError
      );
    }
    throw error;
  }
  if (!updatedPost) {
    await Like.deleteOne({ post: post._id, user: user._id });
    throw new ApiError(404, "Post not found.");
  }

  await notifyPostLike({ actor: user, post });

  return { likeCount: updatedPost.likeCount, isLiked: true };
};

export const unlikePost = async (user, postId) => {
  const post = await getPostById(user, postId);
  const result = await Like.deleteOne({ post: post._id, user: user._id });

  if (result.deletedCount === 0) {
    return { likeCount: post.likeCount, isLiked: false };
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: post._id, likeCount: { $gt: 0 } },
    { $inc: { likeCount: -1 } },
    { returnDocument: "after", projection: { likeCount: 1 } }
  ).lean();
  if (!updatedPost) {
    if (await Post.exists({ _id: post._id })) {
      throw new ApiError(500, "Could not update the post like count.");
    }
    return { likeCount: 0, isLiked: false };
  }

  return { likeCount: updatedPost.likeCount, isLiked: false };
};

export const addComment = async (user, postId, commentData) => {
  const post = await getPostById(user, postId);
  let parentComment = null;

  if (commentData.parentComment) {
    parentComment = await Comment.findOne({
      _id: commentData.parentComment,
      post: post._id,
      parentComment: null,
    });
    if (!parentComment) {
      throw new ApiError(
        400,
        "Replies must target an existing top-level comment on this post."
      );
    }
  }

  const comment = await Comment.create({
    post: post._id,
    author: user._id,
    content: commentData.content.trim(),
    parentComment: parentComment?._id ?? null,
  });
  let postUpdate;
  try {
    postUpdate = await Post.updateOne(
      { _id: post._id },
      { $inc: { commentCount: 1 } }
    );
  } catch (error) {
    try {
      await Comment.deleteOne({ _id: comment._id });
    } catch (cleanupError) {
      console.error(
        "Failed to roll back a comment after counter update failed.",
        cleanupError
      );
    }
    throw error;
  }
  if (postUpdate.matchedCount !== 1) {
    await Comment.deleteOne({ _id: comment._id });
    throw new ApiError(404, "Post not found.");
  }

  await notifyPostComment({ actor: user, post, comment });

  return comment.populate("author", AUTHOR_FIELDS);
};

export const getComments = async (viewer, postId, pagination) => {
  const post = await getPostById(viewer, postId);
  const { page, limit, skip } = getPagination(pagination);
  const [rootComments, total] = await Promise.all([
    Comment.find({ post: post._id, parentComment: null })
      .populate("author", AUTHOR_FIELDS)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ post: post._id, parentComment: null }),
  ]);
  const rootIds = rootComments.map((comment) => comment._id);
  const replyCounts = rootIds.length
    ? await Comment.aggregate([
        {
          $match: {
            post: post._id,
            parentComment: { $in: rootIds },
          },
        },
        { $group: { _id: "$parentComment", count: { $sum: 1 } } },
      ])
    : [];
  const replyCountByParent = new Map(
    replyCounts.map(({ _id, count }) => [String(_id), count])
  );

  return {
    comments: rootComments
      .filter((comment) => comment.author)
      .map((comment) => ({
        ...comment,
        replyCount: replyCountByParent.get(String(comment._id)) ?? 0,
      })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCommentReplies = async (
  viewer,
  postId,
  commentId,
  pagination
) => {
  const post = await getPostById(viewer, postId);
  const parentComment = await Comment.findOne({
    _id: commentId,
    post: post._id,
    parentComment: null,
  })
    .select("_id")
    .lean();
  if (!parentComment) {
    throw new ApiError(404, "Comment not found.");
  }

  const { page, limit, skip } = getPagination(pagination);
  const filter = { post: post._id, parentComment: parentComment._id };
  const [replies, total] = await Promise.all([
    Comment.find(filter)
      .populate("author", AUTHOR_FIELDS)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  return {
    replies: replies.filter((reply) => reply.author),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateComment = async (user, commentId, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }
  if (!comment.author.equals(user._id)) {
    throw new ApiError(403, "You can only modify your own comments.");
  }

  await getPostById(user, comment.post);
  comment.content = content.trim();
  comment.isEdited = true;
  await comment.save();
  return comment.populate("author", AUTHOR_FIELDS);
};

export const deleteComment = async (user, commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }
  if (!comment.author.equals(user._id)) {
    throw new ApiError(403, "You can only modify your own comments.");
  }

  await getPostById(user, comment.post);
  const commentFilter = comment.parentComment
    ? { _id: comment._id, post: comment.post }
    : {
        post: comment.post,
        $or: [{ _id: comment._id }, { parentComment: comment._id }],
      };
  const deletedComments = await Comment.deleteMany(commentFilter);
  const deletedCount = deletedComments.deletedCount;
  if (deletedCount > 0) {
    const postUpdate = await Post.updateOne(
      { _id: comment.post, commentCount: { $gte: deletedCount } },
      { $inc: { commentCount: -deletedCount } }
    );
    if (
      postUpdate.matchedCount !== 1 &&
      (await Post.exists({ _id: comment.post }))
    ) {
      throw new ApiError(500, "Could not update the post comment count.");
    }
  }
};
