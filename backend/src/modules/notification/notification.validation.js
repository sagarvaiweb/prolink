import Joi from "joi";

export const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number.",
    "number.integer": "Page must be a whole number.",
    "number.min": "Page must be at least 1.",
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "Limit must be a number.",
    "number.integer": "Limit must be a whole number.",
    "number.min": "Limit must be at least 1.",
    "number.max": "Limit cannot exceed 50.",
  }),
});

export const notificationIdSchema = Joi.object({
  notificationId: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "Notification ID is required.",
    "string.hex": "Invalid notification ID format.",
    "string.length": "Invalid notification ID format.",
  }),
});
