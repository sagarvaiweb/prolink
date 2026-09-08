import Joi from "joi";

// validation schema for getting user by ID
export const getUserByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid user ID format.",
    "string.length": "Invalid user ID format.",
    "string.empty": "User ID is required.",
  }),
});