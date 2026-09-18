import Joi from "joi";

// Validation schema for sending a professional connection request
export const sendConnectionRequestSchema = Joi.object({
  recipient: Joi.string().trim().hex().length(24).required().messages({
    "string.empty": "Recipient is required.",
    "string.hex": "Invalid recipient ID format.",
    "string.length": "Invalid recipient ID format.",
  }),
});
