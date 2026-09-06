import { Router } from "express";
import { registerUser ,verifyEmail } from "./auth.controller.js";
import  validateRequest  from "../../middlewares/validate.middleware.js";
import { registerSchema ,verifyEmailSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmail);

export default router;