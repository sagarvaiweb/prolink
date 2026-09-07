import rateLimit from "express-rate-limit";

// Rate Limiter Middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});