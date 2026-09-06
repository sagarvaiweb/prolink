import  asyncHandler  from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js"; 
import * as authService from "./auth.service.js";

export const registerUser = asyncHandler(async (req, res) => {
  const newUser = await authService.registerUser(req.body);

  return res.status(201).json(
      new ApiResponse(201, newUser, "Registration successful. Please check your email for the verification code.")
    );
}); 