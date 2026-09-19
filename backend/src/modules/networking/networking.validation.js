import Joi from "joi";

// Validation schema for sending a professional connection request
export const sendConnectionRequestSchema = Joi.object({
  recipient: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "Recipient is required.",
    "string.hex": "Invalid recipient ID format.",
    "string.length": "Invalid recipient ID format.",
  }),
});

// Validation schema for accepting a connection request
export const acceptConnectionRequestSchema = Joi.object({
  connectionId: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "Connection request ID is required.",
    "string.hex": "Invalid connection request ID format.",
    "string.length": "Invalid connection request ID format.",
  }),
});

// Validation schema for listing accepted connections
export const getConnectionsSchema = Joi.object({
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

// Validation schema for checking connection status with another user
export const connectionStatusSchema = Joi.object({
  userId: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "User ID is required.",
    "string.hex": "Invalid user ID format.",
    "string.length": "Invalid user ID format.",
  }),
});
