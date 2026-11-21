import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { autocomplete as getAutocomplete } from "./autocomplete.service.js";
import {
  clearRecentSearches as clearSearchHistory,
  deleteRecentSearch as removeSearchHistoryEntry,
  getRecentSearches as listRecentSearches,
  recordRecentSearch,
} from "./recentSearch.service.js";
import { search as searchResults } from "./search.service.js";

export const search = asyncHandler(async (req, res) => {
  const result = await searchResults(req.user, req.validatedQuery);
  await recordRecentSearch(req.user._id, req.validatedQuery);

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

export const getRecentSearches = asyncHandler(async (req, res) => {
  const result = await listRecentSearches(
    req.user._id,
    req.validatedQuery.limit
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, "Recent searches fetched successfully."));
});

export const deleteRecentSearch = asyncHandler(async (req, res) => {
  await removeSearchHistoryEntry(req.user._id, req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Recent search deleted successfully."));
});

export const clearRecentSearches = asyncHandler(async (req, res) => {
  await clearSearchHistory(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Recent searches cleared successfully."));
});
