import { AdminActionLog } from "../../models/AdminActionLog.model.js";
import ApiError from "../../utils/ApiError.js";

export const logAdminAction = ({ admin, action, targetType, targetId, note = "" }) =>
  AdminActionLog.create({
    admin: admin._id,
    action,
    targetType,
    targetId,
    note,
  });

export const getAdminActionLogs = async (admin, query) => {
  if (!admin || admin.role !== "admin") {
    throw new ApiError(403, "Admin access required.");
  }
  if (admin.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }

  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.targetType) filter.targetType = query.targetType;
  if (query.targetId) filter.targetId = query.targetId;

  const [logs, total] = await Promise.all([
    AdminActionLog.find(filter)
      .populate("admin", "firstName lastName username avatar")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AdminActionLog.countDocuments(filter),
  ]);

  return {
    logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
