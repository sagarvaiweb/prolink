import { Router } from "express";
import { registerUser , resendVerification ,verifyEmail , loginUser } from "./auth.controller.js";
import  validateRequest  from "../../middlewares/validate.middleware.js";
import { registerSchema ,resendVerificationSchema,verifyEmailSchema , loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", validateRequest(resendVerificationSchema), resendVerification);
router.post("/login", validateRequest(loginSchema), loginUser);

export default router;