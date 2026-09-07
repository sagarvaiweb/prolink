import { Router } from "express";
import { registerUser , resendVerification ,verifyEmail , loginUser , getCurrentUser , logoutUser } from "./auth.controller.js";
import  validateRequest  from "../../middlewares/validate.middleware.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import { registerSchema ,resendVerificationSchema,verifyEmailSchema , loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", validateRequest(resendVerificationSchema), resendVerification);
router.post("/login", validateRequest(loginSchema), loginUser);

// Protected routes
router.get("/me", authenticateUser, getCurrentUser);
router.post("/logout", authenticateUser, logoutUser);

export default router;