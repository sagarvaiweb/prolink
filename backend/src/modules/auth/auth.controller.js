import  asyncHandler  from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js"; 
import * as authService from "./auth.service.js";

// for user registration
export const registerUser = asyncHandler(async (req, res) => {
  const newUser = await authService.registerUser(req.body);

  return res.status(201).json(
      new ApiResponse(201, newUser, "Registration successful. Please check your email for the verification code.")
    );
}); 

// for email verification
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body);

  return res.status(200).json(
    new ApiResponse(200, result, "Email verified successfully."));
});

// for resending email verification OTP
export const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body);

  return res.status(200).json(
    new ApiResponse(200, result, "Verification code resent successfully."));
});

// for user login
export const loginUser = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  return res.status(200).cookie("refreshToken", refreshToken, cookieOptions).json(
        new ApiResponse(200, { user, accessToken }, "Login successful."));
});