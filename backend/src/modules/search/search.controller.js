import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { searchKeyword } from "./search.service.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchKeyword(req.user, req.validatedQuery);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Search results fetched successfully."));
});
