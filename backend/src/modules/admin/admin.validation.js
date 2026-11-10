import Joi from "joi";

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
