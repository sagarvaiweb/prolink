import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { autocomplete as getAutocomplete } from "./autocomplete.service.js";
import { search as searchResults } from "./search.service.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchResults(req.user, req.validatedQuery);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Search results fetched successfully."));
});

export const autocomplete = asyncHandler(async (req, res) => {
  const result = await getAutocomplete(req.user, req.validatedQuery);

  res
    .status(200)
    .json(new ApiResponse(200, result, "Search suggestions fetched successfully."));
});
