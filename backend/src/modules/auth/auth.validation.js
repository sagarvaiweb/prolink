import Joi from "joi";

// Validation schema for user registration
export const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters.",
  }),

  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Last name is required.",
  }),

  username: Joi.string().trim().lowercase().alphanum().min(3).max(30).required().messages({
      "string.empty": "Username is required.",
      "string.alphanum": "Username can only contain letters and numbers.",
      "string.min": "Username must be at least 3 characters.",
    }),

  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),

  password: Joi.string().min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=]).{8,}$"))
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.pattern.base":
        "Password must include an uppercase letter, lowercase letter, number, and special character.",
    }),

  role: Joi.string()
    .valid("student", "professional", "recruiter")
    .required()
    .messages({
      "any.only": "Role must be student, professional, or recruiter.",
      "string.empty": "Role is required.",
    }),

});

// Validation schema for email verification
export const verifyEmailSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),

  otp: Joi.string().trim().length(6).pattern(/^[0-9]+$/).required().messages({
      "string.empty": "OTP is required.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must contain only numbers.",
    }),
});

// Validation schema for resending email verification OTP
export const resendVerificationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
});

// Validation schema for user login
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required.",
  }),
});

// Validation schema for forgot password
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
});

// Validation schema for reset password
export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Enter a valid email address.",
  }),
  otp: Joi.string().trim().length(6).pattern(/^[0-9]+$/).required().messages({
    "string.empty": "OTP is required.",
    "string.length": "OTP must be exactly 6 digits.",
    "string.pattern.base": "OTP must contain only numbers.",
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=]).{8,}$"))
    .required()
    .messages({
      "string.empty": "New password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.pattern.base":
        "Password must include an uppercase letter, lowercase letter, number, and special character.",
    }),
});

// Validation schema for changing password
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    "string.empty": "Current password is required.",
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=]).{8,}$"))
    .required()
    .messages({
      "string.empty": "New password is required.",
      "string.min": "Password must be at least 8 characters.",
      "string.pattern.base":
        "Password must include an uppercase letter, lowercase letter, number, and special character.",
    }),
});