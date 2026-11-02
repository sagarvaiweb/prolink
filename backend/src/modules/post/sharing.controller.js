import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as sharingService from "./sharing.service.js";

export const sharePost = asyncHandler(async (req, res) => {
  const post = await sharingService.sharePost(
    req.user,
    req.params.postId,
    req.body
  );
  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post shared successfully."));
});

export const savePost = asyncHandler(async (req, res) => {
  const result = await sharingService.savePost(req.user, req.params.postId);
  return res
    .status(201)
    .json(new ApiResponse(201, result, "Post saved successfully."));
});

export const unsavePost = asyncHandler(async (req, res) => {
  const result = await sharingService.unsavePost(req.user, req.params.postId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Post removed from saved posts."));
});

export const getSavedPosts = asyncHandler(async (req, res) => {
  const result = await sharingService.getSavedPosts(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Saved posts fetched successfully."));
});
