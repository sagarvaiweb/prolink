import Joi from "joi";

// validation schema for getting user by ID
export const getUserByIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid user ID format.",
    "string.length": "Invalid user ID format.",
    "string.empty": "User ID is required.",
  }),
});

// validation schema for updating user details (admin only)
export const updateUserSchema = Joi.object({
  role: Joi.string().valid("student", "professional", "recruiter", "admin").messages({
      "any.only": "Role must be student, professional, recruiter, or admin.",
    }),

  isVerified: Joi.boolean().messages({
    "boolean.base": "isVerified must be true or false.",
  }),
}).min(1); // at least one field must be provided

// validation schema for updating user account status (admin only)
export const updateAccountStatusSchema = Joi.object({
  accountStatus: Joi.string().valid("active", "inactive", "suspended", "deleted").required().messages({
      "any.only": "Status must be active, inactive, suspended, or deleted.",
      "string.empty": "Account status is required.",
    }),
});