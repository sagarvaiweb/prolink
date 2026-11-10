import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { getAdminActionLogs } from "./actionLog.service.js";

export const getActionLogs = asyncHandler(async (req, res) => {
  const result = await getAdminActionLogs(req.user, req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Admin action logs fetched successfully."));
});
