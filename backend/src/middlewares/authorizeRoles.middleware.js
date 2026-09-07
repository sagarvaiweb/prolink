import ApiError from "../utils/ApiError.js";

// Middleware to authorize users based on their roles
const authorizeRole = (...allowedRoles) => {  // Accepts a list of allowed roles as arguments
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "No permission for this resource.");
    }

    next();
  };
};

export default authorizeRole;