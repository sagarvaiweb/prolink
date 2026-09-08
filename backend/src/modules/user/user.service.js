import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

// Paginated list of all users (admin only)
export const getAllUsers = async ({ page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const users = await User.find().skip(skip).limit(limit).sort({ createdAt: -1 });

  const totalUsers = await User.countDocuments();

  return {
    users,
    pagination: {
      total: totalUsers,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalUsers / limit),
    },
  };
};

// Get a single user by ID (admin only)
export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }
  return user;
};

// Admin updates a user's role or recruiter verification status
export const updateUser = async (id, updates) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  if (updates.role !== undefined) user.role = updates.role;
  if (updates.isVerified !== undefined) user.isVerified = updates.isVerified;

  await user.save();

  return user;
};

// Admin suspends, activates, or soft-deletes a user's account
export const updateAccountStatus = async (id, accountStatus) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  user.accountStatus = accountStatus;
  await user.save();

  return user;
};

// Admin permanently removes a user account
export const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  await User.findByIdAndDelete(id);

  return { message: "User deleted successfully." };
};