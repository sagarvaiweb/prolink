import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { searchJobs } from "./search.service.js";

export const searchJobsController = asyncHandler(async (req, res) => {
  const result = await searchJobs(req.user, req.validatedQuery);
  res.status(200).json(new ApiResponse(200, result, "Job search completed."));
});
