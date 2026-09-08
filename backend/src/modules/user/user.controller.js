import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as userService from "./user.service.js";

// for getting all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await userService.getAllUsers({ page, limit });

  return res.status(200).json(
    new ApiResponse(200, result, "Users fetched successfully."));
});

// for getting a single user by ID (admin only)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully."));
});