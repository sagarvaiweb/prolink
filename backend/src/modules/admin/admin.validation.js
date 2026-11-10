import Joi from "joi";
import { ADMIN_ACTIONS, ADMIN_TARGET_TYPES } from "../../models/AdminActionLog.model.js";

const objectId = Joi.string().hex().length(24).required().messages({
  "string.hex": "ID must be a valid ObjectId.",
  "string.length": "ID must be a valid ObjectId.",
});

export const adminReportParamsSchema = Joi.object({ reportId: objectId }).unknown(false);

export const adminReportsQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "dismissed", "actioned", "post_removed"),
  type: Joi.string().valid("post"),
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
}).unknown(false);

export const adminReportActionSchema = Joi.object({
  action: Joi.string()
    .valid("dismiss", "remove_content", "warn_user", "suspend_reporter")
    .required(),
  note: Joi.string().trim().max(500).allow("").default(""),
}).unknown(false);

export const adminCompanyReviewSchema = Joi.object({
  decision: Joi.string().valid("approve", "reject").required(),
  note: Joi.string()
    .trim()
    .max(500)
    .when("decision", {
      is: "reject",
      then: Joi.required(),
      otherwise: Joi.optional().allow(""),
    }),
}).unknown(false);

export const adminUsersQuerySchema = Joi.object({
  search: Joi.string().trim().min(1).max(100),
  role: Joi.string().valid("student", "professional", "recruiter", "admin"),
  status: Joi.string().valid("active", "inactive", "suspended", "deleted"),
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).unknown(false);

export const adminUserParamsSchema = Joi.object({ id: objectId }).unknown(false);

export const adminUserRoleSchema = Joi.object({
  role: Joi.string().valid("student", "professional", "recruiter", "admin").required(),
  note: Joi.string().trim().max(500).allow(""),
}).unknown(false);

export const adminUserStatusSchema = Joi.object({
  accountStatus: Joi.string()
    .valid("active", "inactive", "suspended", "deleted")
    .required(),
  note: Joi.string().trim().max(500).allow(""),
}).unknown(false);

export const adminActionLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  action: Joi.string().valid(...ADMIN_ACTIONS),
  targetType: Joi.string().valid(...ADMIN_TARGET_TYPES),
  targetId: Joi.string().hex().length(24).messages({
    "string.hex": "Target ID must be a valid ObjectId.",
    "string.length": "Target ID must be a valid ObjectId.",
  }),
}).unknown(false);

export const adminJobRemovalSchema = Joi.object({
  note: Joi.string().trim().max(500).allow(""),
}).unknown(false);
