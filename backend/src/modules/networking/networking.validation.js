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
