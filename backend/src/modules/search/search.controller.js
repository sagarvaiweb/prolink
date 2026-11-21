import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { search as searchResults } from "./search.service.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchResults(req.user, req.validatedQuery);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Search results fetched successfully."));
});
