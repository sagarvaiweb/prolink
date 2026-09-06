import { Router } from "express";
import { registerUser } from "./auth.controller.js";
import  validateRequest  from "../../middlewares/validate.middleware.js";
import { registerSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerUser);

export default router;