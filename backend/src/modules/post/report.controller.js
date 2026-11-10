import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as reportService from "./report.service.js";

export const reportPost = asyncHandler(async (req, res) => {
  const report = await reportService.reportPost(
    req.user,
    req.params.postId,
    req.body
  );
  return res
    .status(201)
    .json(new ApiResponse(201, report, "Post reported for review."));
});

export const getPostReports = asyncHandler(async (req, res) => {
  const reports = await reportService.getPostReports(req.user, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, reports, "Pending post reports fetched successfully."));
});

export const reviewPostReport = asyncHandler(async (req, res) => {
  const report = await reportService.reviewPostReport(
    req.user,
    req.params.reportId,
    req.body.action ?? req.body.status,
    req.body.note
  );
  return res
    .status(200)
    .json(new ApiResponse(200, report, "Post report reviewed successfully."));
});
