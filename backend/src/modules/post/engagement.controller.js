import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as engagementService from "./engagement.service.js";

export const likePost = asyncHandler(async (req, res) => {
  const result = await engagementService.likePost(req.user, req.params.postId);
  return res
    .status(201)
    .json(new ApiResponse(201, result, "Post liked successfully."));
});

export const unlikePost = asyncHandler(async (req, res) => {
  const result = await engagementService.unlikePost(req.user, req.params.postId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post unliked successfully."));
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await engagementService.addComment(
    req.user,
    req.params.postId,
    req.body
  );
  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully."));
});

export const getComments = asyncHandler(async (req, res) => {
  const comments = await engagementService.getComments(
    req.user,
    req.params.postId,
    req.query
  );
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully."));
});

export const getCommentReplies = asyncHandler(async (req, res) => {
  const replies = await engagementService.getCommentReplies(
    req.user,
    req.params.postId,
    req.params.commentId,
    req.query
  );
  return res
    .status(200)
    .json(new ApiResponse(200, replies, "Comment replies fetched successfully."));
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await engagementService.updateComment(
    req.user,
    req.params.commentId,
    req.body.content
  );
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully."));
});

export const deleteComment = asyncHandler(async (req, res) => {
  await engagementService.deleteComment(req.user, req.params.commentId);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully."));
});
