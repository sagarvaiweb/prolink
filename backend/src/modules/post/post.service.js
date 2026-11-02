import { Connection } from "../../models/Connection.model.js";
import { Follow } from "../../models/Follow.model.js";
import { Post } from "../../models/Post.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import {
  cleanupUploadedPostMedia,
  deletePostMedia,
} from "../../utils/postMedia.util.js";

const AUTHOR_FIELDS = "firstName lastName username avatar role";

const ensureActiveUser = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active");
  }
};

const normalizeWriteError = (error) => {
  if (error?.name !== "ValidationError") return error;

  return new ApiError(
    400,
    "Validation failed",
    Object.values(error.errors).map((validationError) => validationError.message)
  );
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

const getActiveUser = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    accountStatus: "active",
  })
    .select("_id")
    .lean();

  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  return user;
};

const getConnectionIds = async (userId) => {
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .select("requester recipient")
    .lean();

  return connections.map((connection) =>
    String(
      String(connection.requester) === String(userId)
        ? connection.recipient
        : connection.requester
    )
  );
};

const getActiveAudience = async (userId) => {
  const [connectionIds, follows] = await Promise.all([
    getConnectionIds(userId),
    Follow.find({ follower: userId }).select("following").lean(),
  ]);
  const connectedIds = [...new Set(connectionIds)];
  const audienceIds = [
    ...new Set([
      String(userId),
      ...connectedIds,
      ...follows.map((follow) => String(follow.following)),
    ]),
  ];
  const activeUsers = await User.find({
    _id: { $in: audienceIds },
    accountStatus: "active",
  })
    .select("_id")
    .lean();
  const activeIds = activeUsers.map((activeUser) => String(activeUser._id));
  const activeIdSet = new Set(activeIds);

  return {
    audienceIds: activeIds,
    connectedIds: connectedIds.filter((id) => activeIdSet.has(id)),
  };
};

const isConnected = async (firstUserId, secondUserId) => {
  if (String(firstUserId) === String(secondUserId)) return true;

  return Boolean(
    await Connection.exists({
      status: "accepted",
      $or: [
        { requester: firstUserId, recipient: secondUserId },
        { requester: secondUserId, recipient: firstUserId },
      ],
    })
  );
};

const getPostPage = async (filter, pagination) => {
  const { page, limit, skip } = getPagination(pagination);
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate("author", AUTHOR_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getPostOrFail = async (postId) => {
  const post = await Post.findById(postId).populate("author", AUTHOR_FIELDS);
  if (!post || !post.author) {
    throw new ApiError(404, "Post not found.");
  }
  return post;
};

export const createPost = async (author, postData, files = []) => {
  const mediaUrls = files.map((file) => file.path);
  let post;
  try {
    ensureActiveUser(author);
    post = await Post.create({
      author: author._id,
      content: postData.content,
      mediaUrls,
      visibility: postData.visibility,
    });
  } catch (error) {
    try {
      await cleanupUploadedPostMedia(files);
    } catch (cleanupError) {
      console.error("Failed to clean up post images after creation failed.", cleanupError);
    }
    throw normalizeWriteError(error);
  }

  return post.populate("author", AUTHOR_FIELDS);
};

export const getFeed = async (user, pagination) => {
  ensureActiveUser(user);
  const { audienceIds, connectedIds } = await getActiveAudience(user._id);
  const connectionVisibilityIds = [
    ...new Set([String(user._id), ...connectedIds]),
  ];

  return getPostPage(
    {
      author: { $in: audienceIds },
      $or: [
        { visibility: "public" },
        { author: { $in: connectionVisibilityIds } },
      ],
    },
    pagination
  );
};

export const getPostById = async (viewer, postId) => {
  ensureActiveUser(viewer);
  const post = await getPostOrFail(postId);
  const authorId = post.author._id;

  if (
    post.visibility === "connections" &&
    !(await isConnected(viewer._id, authorId))
  ) {
    throw new ApiError(403, "You cannot view this post.");
  }

  const authorIsActive = await User.exists({
    _id: authorId,
    accountStatus: "active",
  });
  if (!authorIsActive) {
    throw new ApiError(404, "Post not found.");
  }

  return post;
};

export const getPostsByUser = async (viewer, authorId, pagination) => {
  ensureActiveUser(viewer);
  await getActiveUser(authorId);

  const isOwner = String(viewer._id) === String(authorId);
  const isAuthorConnection = isOwner || (await isConnected(viewer._id, authorId));
  const filter = { author: authorId };

  if (isAuthorConnection) {
    filter.visibility = { $in: ["public", "connections"] };
  } else {
    filter.visibility = "public";
  }

  return getPostPage(filter, pagination);
};

export const updatePost = async (user, postId, updates, files = []) => {
  let post;
  let previousMediaUrls = [];
  try {
    ensureActiveUser(user);
    post = await Post.findById(postId);

    if (!post) {
      throw new ApiError(404, "Post not found.");
    }
    if (!post.author.equals(user._id)) {
      throw new ApiError(403, "You can only modify your own posts.");
    }

    if (Object.hasOwn(updates, "content")) post.content = updates.content;
    if (Object.hasOwn(updates, "visibility")) {
      post.visibility = updates.visibility;
    }
    previousMediaUrls = post.mediaUrls;
    if (files.length > 0) post.mediaUrls = files.map((file) => file.path);
    else if (updates.clearMedia) post.mediaUrls = [];

    post.isEdited = true;
    await post.save();
  } catch (error) {
    try {
      await cleanupUploadedPostMedia(files);
    } catch (cleanupError) {
      console.error("Failed to clean up post images after update failed.", cleanupError);
    }
    throw normalizeWriteError(error);
  }

  if (files.length > 0 || updates.clearMedia) {
    await deletePostMedia(previousMediaUrls);
  }
  return post.populate("author", AUTHOR_FIELDS);
};

export const deletePost = async (user, postId) => {
  ensureActiveUser(user);
  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }
  if (!post.author.equals(user._id)) {
    throw new ApiError(403, "You can only modify your own posts.");
  }

  const mediaUrls = post.mediaUrls;
  await post.deleteOne();
  await deletePostMedia(mediaUrls);
};
