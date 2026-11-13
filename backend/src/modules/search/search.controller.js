import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as searchService from "./search.service.js";

export const searchController = asyncHandler(async (req, res) => {
  const result = await searchService.search(req.user, req.validatedQuery);
  res.status(200).json(new ApiResponse(200, result, "Search completed."));
});
export const autocompleteController = asyncHandler(async (req, res) => {
  const suggestions = await searchService.autocomplete(req.validatedQuery.q);
  res.status(200).json(new ApiResponse(200, { suggestions }, "Suggestions fetched."));
});
export const getRecentSearchesController = asyncHandler(async (req, res) => {
  const searches = await searchService.getRecentSearches(req.user._id);
  res.status(200).json(new ApiResponse(200, { searches }, "Recent searches fetched."));
});
export const deleteRecentSearchController = asyncHandler(async (req, res) => {
  await searchService.deleteRecentSearch(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Recent search deleted."));
});
export const clearRecentSearchesController = asyncHandler(async (req, res) => {
  await searchService.clearRecentSearches(req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Recent searches cleared."));
});
