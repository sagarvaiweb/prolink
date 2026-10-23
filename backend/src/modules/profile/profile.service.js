import { Profile } from "../../models/Profile.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

// Weighted profile completion calculation
const calculateCompletion = (profile) => {
  let score = 0;
  if (profile.headline) score += 15;
  if (profile.bio) score += 15;
  if (profile.location) score += 10;
  if (profile.experience.length > 0) score += 25;
  if (profile.education.length > 0) score += 20;
  if (profile.skills.length >= 3) score += 15;
  return Math.min(score, 100);
};

// Ensures a Profile document exists for this user, creating one if needed
// (e.g. right after registration, a user has no profile yet)
const findOrCreateProfile = async (userId) => {
  let profile = await Profile.findOne({ user: userId });
  if (!profile) {
    profile = await Profile.create({ user: userId });
  }
  return profile;
};

// Get the profile of the currently authenticated user
export const getMyProfile = async (userId) => {
  const profile = await findOrCreateProfile(userId);
  return profile;
};

// Get the profile of another user by their userId, with visibility checks
export const getProfileByUserId = async (targetUserId, requesterId) => {
  const profile = await Profile.findOne({ user: targetUserId }).populate(
    "user",
    "firstName lastName username avatar role"
  );

  if (!profile) {
    throw new ApiError(404, "Profile not found.");
  }

  const isOwner = String(profile.user._id) === String(requesterId);

  if (!isOwner) {
    if (profile.visibility === "private") {
      throw new ApiError(403, "This profile is private.");
    }
    // "connections" visibility would check a Connections model here (future module)
    // For now, treat "connections" the same as public until that module exists

    // Log a view + increment count (only for non-owner views)
    profile.viewCount += 1;
    await profile.save();
  }

  return profile;
};

// update the profile of the currently authenticated user
export const updateProfile = async (userId, updates) => {
  const profile = await findOrCreateProfile(userId);

  Object.assign(profile, updates);
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// add a new experience entry to the profile of the currently authenticated user
export const addExperience = async (userId, experienceData) => {
  const profile = await findOrCreateProfile(userId);

  profile.experience.push(experienceData);
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// update an existing experience entry in the profile of the currently authenticated user
export const updateExperience = async (userId, experienceId, updates) => {
  const profile = await findOrCreateProfile(userId);

  const exp = profile.experience.id(experienceId);
  if (!exp) {
    throw new ApiError(404, "Experience entry not found.");
  }

  Object.assign(exp, updates);
  await profile.save();

  return profile;
};

// delete an experience entry from the profile of the currently authenticated user
export const deleteExperience = async (userId, experienceId) => {
  const profile = await findOrCreateProfile(userId);

  const exp = profile.experience.id(experienceId);
  if (!exp) {
    throw new ApiError(404, "Experience entry not found.");
  }

  exp.deleteOne();
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// update the skills of the currently authenticated user
export const updateSkills = async (userId, skills) => {
  const profile = await findOrCreateProfile(userId);

  // Deduplicate, in case the frontend ever sends duplicates
  profile.skills = [...new Set(skills)];
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// add a new education entry to the profile of the currently authenticated user
export const addEducation = async (userId, educationData) => {
  const profile = await findOrCreateProfile(userId);

  profile.education.push(educationData);
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// update an existing education entry in the profile of the currently authenticated user
export const updateEducation = async (userId, educationId, updates) => {
  const profile = await findOrCreateProfile(userId);

  const edu = profile.education.id(educationId);
  if (!edu) {
    throw new ApiError(404, "Education entry not found.");
  }

  Object.assign(edu, updates);
  await profile.save();

  return profile;
};

// delete an education entry from the profile of the currently authenticated user
export const deleteEducation = async (userId, educationId) => {
  const profile = await findOrCreateProfile(userId);

  const edu = profile.education.id(educationId);
  if (!edu) {
    throw new ApiError(404, "Education entry not found.");
  }

  edu.deleteOne();
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();

  return profile;
};

// upload a new profile photo (avatar) for the currently authenticated user
export const uploadProfilePhoto = async (userId, fileUrl) => {
  const user = await User.findByIdAndUpdate(userId, { avatar: fileUrl }, { new: true });
  if (!user) throw new ApiError(404, "User account not found.");
  return { avatar: user.avatar };
};

// upload a new cover photo for the currently authenticated user
export const uploadCoverPhoto = async (userId, fileUrl) => {
  const profile = await findOrCreateProfile(userId);
  profile.coverPhoto = fileUrl;
  await profile.save();
  return profile;
};

// upload a new resume for the currently authenticated user
export const uploadResume = async (userId, fileUrl) => {
  const profile = await findOrCreateProfile(userId);
  profile.resumeUrl = fileUrl;
  profile.profileCompletion = calculateCompletion(profile);
  await profile.save();
  return profile;
};

