import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as analyticsService from "./analytics.service.js";
import * as recruiterAnalyticsService from "./recruiterAnalytics.service.js";
import * as adminAnalyticsService from "./adminAnalytics.service.js";

const getRange = (req) => req.query.range || "30d";

export const getProfileViewStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProfileViewStats(req.user, getRange(req));
  res.status(200).json(new ApiResponse(200, data, "Profile view analytics fetched successfully."));
});

export const getPostEngagementStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getPostEngagementStats(req.user, getRange(req));
  res.status(200).json(new ApiResponse(200, data, "Post engagement analytics fetched successfully."));
});

export const getNetworkGrowthStats = asyncHandler(async (req, res) => {
  const data = await analyticsService.getNetworkGrowthStats(req.user, getRange(req));
  res.status(200).json(new ApiResponse(200, data, "Network growth analytics fetched successfully."));
});

export const getApplicationsSummary = asyncHandler(async (req, res) => {
  const data = await analyticsService.getApplicationsSummary(req.user);
  res.status(200).json(new ApiResponse(200, data, "Application summary fetched successfully."));
});

export const getRecruiterJobFunnel = asyncHandler(async (req, res) => {
  const data = await recruiterAnalyticsService.getJobFunnel(
    req.user,
    req.params.jobId
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, "Job application funnel fetched successfully."));
});

export const getRecruiterJobsOverview = asyncHandler(async (req, res) => {
  const data = await recruiterAnalyticsService.getJobsOverview(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, data, "Recruiter job analytics fetched successfully."));
});

export const getAdminPlatformStats = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getPlatformStats(
    req.user,
    getRange(req)
  );
  res
    .status(200)
    .json(new ApiResponse(200, data, "Platform analytics fetched successfully."));
});
