import { AdminActionLog } from "../../models/AdminActionLog.model.js";

export const logAdminAction = ({ admin, action, targetType, targetId, note = "" }) =>
  AdminActionLog.create({
    admin: admin._id,
    action,
    targetType,
    targetId,
    note,
  });
