import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
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

// for updating an existing education entry in the profile of currently authenticated user
export const updateEducation = asyncHandler(async (req, res) => {
  const profile = await profileService.updateEducation(req.user._id, req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, profile, "Education updated successfully."));
});

// for deleting an education entry from the profile of currently authenticated user
export const deleteEducation = asyncHandler(async (req, res) => {
  const profile = await profileService.deleteEducation(req.user._id, req.params.id);
  return res.status(200).json(new ApiResponse(200, profile, "Education deleted successfully."));
});

// for uploading profile photo of currently authenticated user
export const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const result = await profileService.uploadProfilePhoto(req.user._id, req.file.path);
  return res.status(200).json(new ApiResponse(200, result, "Profile photo updated successfully."));
});

// for uploading cover photo of currently authenticated user
export const uploadCoverPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const profile = await profileService.uploadCoverPhoto(req.user._id, req.file.path);
  return res.status(200).json(new ApiResponse(200, profile, "Cover photo updated successfully."));
});

// for uploading resume of currently authenticated user
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded.");
  const profile = await profileService.uploadResume(req.user._id, req.file.path);
  return res.status(200).json(new ApiResponse(200, profile, "Resume uploaded successfully."));
});

