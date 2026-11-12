import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import { logAdminAction } from "../admin/actionLog.service.js";

const ADMIN_USER_FIELDS =
  "firstName lastName username email role accountStatus isEmailVerified isVerified avatar createdAt updatedAt lastLogin";

const ensureActiveAdmin = (admin) => {
  if (!admin || admin.role !== "admin") {
    throw new ApiError(403, "Admin access required.");
  }
  if (admin.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Paginated list of all users (admin only)
export const getAllUsers = async (admin, { page = 1, limit = 10 }) => {
  ensureActiveAdmin(admin);
  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;

  const users = await User.find()
    .select(ADMIN_USER_FIELDS)
    .skip(skip)
    .limit(pageSize)
    .sort({ createdAt: -1, _id: -1 });

  const totalUsers = await User.countDocuments();

  return {
    users,
    pagination: {
      total: totalUsers,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(totalUsers / pageSize),
    },
  };
};

export const getAdminUsers = async (admin, query) => {
  ensureActiveAdmin(admin);
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const skip = (page - 1) * limit;
  const filter = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.accountStatus = query.status;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [
      { firstName: search },
      { lastName: search },
      { username: search },
      { email: search },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(ADMIN_USER_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// Get a single user by ID (admin only)
export const getUserById = async (admin, id) => {
  ensureActiveAdmin(admin);
  const user = await User.findById(id).select(ADMIN_USER_FIELDS);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }
  return user;
};

// Admin updates a user's role or recruiter verification status
export const updateUser = async (admin, id, updates, note = "") => {
  ensureActiveAdmin(admin);
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  const previousRole = user.role;
  const previousIsVerified = user.isVerified;
  if (updates.role !== undefined) {
    if (String(user._id) === String(admin._id) && updates.role !== "admin") {
      throw new ApiError(400, "You cannot remove your own administrator role.");
    }
    user.role = updates.role;
  }
  if (updates.isVerified !== undefined) user.isVerified = updates.isVerified;

  await user.save();

  if (updates.role !== undefined && previousRole !== user.role) {
    await logAdminAction({
      admin,
      action: "user_role_changed",
      targetType: "user",
      targetId: user._id,
      note: `Role changed from ${previousRole} to ${user.role}${note ? `; ${note}` : ""}`.slice(0, 500),
    });
  }
  if (updates.isVerified !== undefined && previousIsVerified !== user.isVerified) {
    await logAdminAction({
      admin,
      action: "user_verification_changed",
      targetType: "user",
      targetId: user._id,
      note: `Recruiter verification changed from ${previousIsVerified} to ${user.isVerified}${note ? `; ${note}` : ""}`.slice(0, 500),
    });
  }

  return user;
};

// Admin suspends, activates, or soft-deletes a user's account
export const updateAccountStatus = async (admin, id, accountStatus, note = "") => {
  ensureActiveAdmin(admin);
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  if (String(user._id) === String(admin._id) && accountStatus !== "active") {
    throw new ApiError(400, "You cannot deactivate or suspend your own administrator account.");
  }

  const previousStatus = user.accountStatus;
  user.accountStatus = accountStatus;
  await user.save();

  if (previousStatus !== accountStatus) {
    const action = accountStatus === "suspended"
      ? "user_suspended"
      : accountStatus === "active"
        ? "user_reactivated"
        : "user_status_changed";
    await logAdminAction({
      admin,
      action,
      targetType: "user",
      targetId: user._id,
      note: `Account status changed from ${previousStatus} to ${accountStatus}${note ? `; ${note}` : ""}`.slice(0, 500),
    });
  }

  return user;
};

// Admin permanently removes a user account
export const deleteUser = async (admin, id) => {
  ensureActiveAdmin(admin);
  if (String(admin._id) === String(id)) {
    throw new ApiError(400, "You cannot delete your own administrator account.");
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  await User.findByIdAndDelete(id);
  await logAdminAction({
    admin,
    action: "user_deleted",
    targetType: "user",
    targetId: user._id,
    note: "User account deleted by administrator.",
  });

  return { message: "User deleted successfully." };
};
