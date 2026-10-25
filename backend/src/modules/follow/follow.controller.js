import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as followService from "./follow.service.js";

export const followUser = asyncHandler(async (req, res) => {
  const follow = await followService.followUser(req.user, req.params.userId);

  return res
    .status(201)
    .json(new ApiResponse(201, follow, "User followed successfully."));
});

export const unfollowUser = asyncHandler(async (req, res) => {
  await followService.unfollowUser(req.user, req.params.userId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User unfollowed successfully."));
});

export const getFollowers = asyncHandler(async (req, res) => {
  const result = await followService.getFollowers(
    req.params.userId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Followers fetched successfully."));
});

export const getFollowing = asyncHandler(async (req, res) => {
  const result = await followService.getFollowing(
    req.params.userId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Following list fetched successfully."));
});
