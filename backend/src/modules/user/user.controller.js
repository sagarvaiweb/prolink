import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as userService from "./user.service.js";

// for getting all users (admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.user, req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Users fetched successfully."));
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAdminUsers(req.user, req.validatedQuery);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully."));
});

// for getting a single user by ID (admin only)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, user, "User fetched successfully."));
});

// for updating a user's role or recruiter verification status (admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    req.user,
    req.params.id,
    req.body,
    req.body.note
  );

  return res.status(200).json(
    new ApiResponse(200, user, "User updated successfully."));
});

// for updating a user's account status (admin only)
export const updateAccountStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateAccountStatus(
    req.user,
    req.params.id,
    req.body.accountStatus,
    req.body.note
  );

  return res.status(200).json(
    new ApiResponse(200, user, "Account status updated successfully."));
});

// for deleting a user (admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.deleteUser(req.user, req.params.id);

  return res.status(200).json(
    new ApiResponse(200, result, "User deleted successfully."));
});
