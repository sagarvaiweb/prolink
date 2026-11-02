import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as postService from "./post.service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user, req.body, req.files);
  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully."));
});

export const getFeed = asyncHandler(async (req, res) => {
  const feed = await postService.getFeed(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, feed, "Feed fetched successfully."));
});

export const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.user, req.params.postId);
  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully."));
});

export const getPostsByUser = asyncHandler(async (req, res) => {
  const posts = await postService.getPostsByUser(
    req.user,
    req.params.userId,
    req.query
  );
  return res
    .status(200)
    .json(new ApiResponse(200, posts, "User posts fetched successfully."));
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(
    req.user,
    req.params.postId,
    req.body,
    req.files
  );
  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post updated successfully."));
});

export const deletePost = asyncHandler(async (req, res) => {
  await postService.deletePost(req.user, req.params.postId);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Post deleted successfully."));
});
