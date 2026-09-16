import { Router } from "express";
import { registerUser , resendVerification ,verifyEmail , loginUser , getCurrentUser , logoutUser , refreshAccessToken ,
        forgotPassword , resetPassword , changePassword , oauthCallback } from "./auth.controller.js";

import  validateRequest  from "../../middlewares/validate.middleware.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import { registerSchema ,resendVerificationSchema,verifyEmailSchema , loginSchema ,forgotPasswordSchema ,resetPasswordSchema ,changePasswordSchema } from "./auth.validation.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import passport from "../../config/passport.js";

const router = Router();

router.post("/register", rateLimiter, validateRequest(registerSchema), registerUser);
router.post("/verify-email", validateRequest(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", rateLimiter, validateRequest(resendVerificationSchema), resendVerification);
router.post("/login", rateLimiter, validateRequest(loginSchema), loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", rateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);

// Protected routes
router.get("/me", authenticateUser, getCurrentUser);
router.post("/logout", authenticateUser, logoutUser);
router.post("/change-password", authenticateUser, validateRequest(changePasswordSchema), changePassword);



//  GOOGLE 
router.get("/google", passport.authenticate("google", {
         scope: ["profile", "email"], session: false ,  prompt: "select_account", //  forces Google to always show the account chooser
 }));

router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/login` }),oauthCallback );

// GITHUB 
router.get("/github", passport.authenticate("github", { 
        scope: ["user:email"], session: false ,   prompt: "select_account" //  forces github to always show the account chooser
 }));
 
router.get("/github/callback", passport.authenticate("github", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/auth/login` }), oauthCallback );

export default router;