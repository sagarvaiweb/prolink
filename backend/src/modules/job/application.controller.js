import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as applicationService from "./application.service.js";

export const applyToJob = asyncHandler(async (req, res) => {
  const application = await applicationService.applyToJob(
    req.user,
    req.params.jobId
  );
  res
    .status(201)
    .json(new ApiResponse(201, application, "Application submitted successfully."));
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  await applicationService.withdrawApplication(
    req.user,
    req.params.applicationId
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Application withdrawn successfully."));
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getMyApplications(req.user, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Your applications fetched successfully."));
});

export const getApplicantsForJob = asyncHandler(async (req, res) => {
  const result = await applicationService.getApplicantsForJob(
    req.user,
    req.params.jobId,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Job applicants fetched successfully."));
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const application = await applicationService.updateApplicationStatus(
    req.user,
    req.params.applicationId,
    req.body.status
  );
  res
    .status(200)
    .json(new ApiResponse(200, application, "Application status updated successfully."));
});
