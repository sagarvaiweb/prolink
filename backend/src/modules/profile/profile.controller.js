import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as profileService from "./profile.service.js";

// for getting profile of currently authenticated user
export const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getMyProfile(req.user._id);
  return res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully."));
});

// for getting profile of another user by their userId, with visibility checks
export const getProfileByUserId = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfileByUserId(req.params.userId, req.user._id);
  return res.status(200).json(new ApiResponse(200, profile, "Profile fetched successfully."));
});

// for updating profile of currently authenticated user
export const updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfile(req.user._id, req.body);
  return res.status(200).json(new ApiResponse(200, profile, "Profile updated successfully."));
});

// for adding a new experience entry to the profile of currently authenticated user
export const addExperience = asyncHandler(async (req, res) => {
  const profile = await profileService.addExperience(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, profile, "Experience added successfully."));
});

// for updating an existing experience entry in the profile of currently authenticated user
export const updateExperience = asyncHandler(async (req, res) => {
  const profile = await profileService.updateExperience(req.user._id, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, profile, "Experience updated successfully."));
});

// for deleting an experience entry from the profile of currently authenticated user
export const deleteExperience = asyncHandler(async (req, res) => {
  const profile = await profileService.deleteExperience(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, profile, "Experience deleted successfully."));
});

// for updating the skills of the currently authenticated user
export const updateSkills = asyncHandler(async (req, res) => {
  const profile = await profileService.updateSkills(req.user._id, req.body.skills);
  return res.status(200).json(new ApiResponse(200, profile, "Skills updated successfully."));
});

// for adding a new education entry to the profile of currently authenticated user
export const addEducation = asyncHandler(async (req, res) => {
  const profile = await profileService.addEducation(req.user._id, req.body);
  return res.status(201).json(new ApiResponse(201, profile, "Education added successfully."));
});

