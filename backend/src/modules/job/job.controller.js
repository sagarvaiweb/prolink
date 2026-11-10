import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as jobService from "./job.service.js";

export const createJob = asyncHandler(async (req, res) => {
  const job = await jobService.createJob(req.user, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, job, "Job listing created successfully."));
});

export const getJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getJobs(req.user, req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Job listings fetched successfully."));
});

export const getJobById = asyncHandler(async (req, res) => {
  const job = await jobService.getJobById(req.user, req.params.jobId);
  res
    .status(200)
    .json(new ApiResponse(200, job, "Job listing fetched successfully."));
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.user, req.params.jobId, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, job, "Job listing updated successfully."));
});

export const closeJob = asyncHandler(async (req, res) => {
  const job = await jobService.closeJob(req.user, req.params.jobId);
  res
    .status(200)
    .json(new ApiResponse(200, job, "Job listing closed successfully."));
});

export const deleteJob = asyncHandler(async (req, res) => {
  await jobService.deleteJob(req.user, req.params.jobId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Job listing deleted successfully."));
});

export const saveJob = asyncHandler(async (req, res) => {
  await jobService.saveJob(req.user, req.params.jobId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Job saved successfully."));
});

export const unsaveJob = asyncHandler(async (req, res) => {
  await jobService.unsaveJob(req.user, req.params.jobId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Job removed from saved jobs."));
});

export const getSavedJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getSavedJobs(req.user, req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Saved jobs fetched successfully."));
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const result = await jobService.getMyJobs(req.user, req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Your job listings fetched successfully."));
});

export const getJobsForModeration = asyncHandler(async (req, res) => {
  const result = await jobService.getJobsForModeration(req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Pending job listings fetched successfully."));
});

export const reviewJob = asyncHandler(async (req, res) => {
  const job = await jobService.reviewJob(req.user, req.params.jobId, req.body);
  res
    .status(200)
    .json(new ApiResponse(200, job, "Job listing review completed successfully."));
});

export const removeJobByAdmin = asyncHandler(async (req, res) => {
  await jobService.removeJobByAdmin(req.user, req.params.jobId, req.body?.note ?? "");
  res
    .status(200)
    .json(new ApiResponse(200, null, "Job listing removed successfully."));
});
