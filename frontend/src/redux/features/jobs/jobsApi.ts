import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  JobActionResponse,
  CreateJobPayload,
  JobListParams,
  JobMutationResponse,
  JobPageResponse,
  JobPayload,
  ReviewJobPayload,
  JobResponse,
  UpdateJobPayload,
} from "@/types/job.types";

export const jobsApi = createApi({
  reducerPath: "jobsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Jobs", "SavedJobs", "Job", "RecruiterJobs", "Moderation"],
  endpoints: (builder) => ({
    getJobs: builder.query<JobPageResponse, JobListParams>({
      query: (params) => ({
        url: "/jobs",
        params,
      }),
      providesTags: (result) => [
        { type: "Jobs", id: "LIST" },
        ...(result?.data.jobs.map((job) => ({
          type: "Job" as const,
          id: job._id,
        })) ?? []),
      ],
    }),
    getJobById: builder.query<JobResponse, string>({
      query: (jobId) => `/jobs/${jobId}`,
      providesTags: (_result, _error, jobId) => [{ type: "Job", id: jobId }],
    }),
    getSavedJobs: builder.query<JobPageResponse, Pick<JobListParams, "page" | "limit">>({
      query: ({ page, limit }) => ({
        url: "/jobs/saved",
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "SavedJobs", id: "LIST" },
        ...(result?.data.jobs.map((job) => ({
          type: "Job" as const,
          id: job._id,
        })) ?? []),
      ],
    }),
    getMyJobs: builder.query<JobPageResponse, Pick<JobListParams, "page" | "limit">>({
      query: ({ page, limit }) => ({
        url: "/jobs/mine",
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "RecruiterJobs", id: "LIST" },
        ...(result?.data.jobs.map((job) => ({
          type: "Job" as const,
          id: job._id,
        })) ?? []),
      ],
    }),
    getPendingJobs: builder.query<JobPageResponse, Pick<JobListParams, "page" | "limit">>({
      query: ({ page, limit }) => ({
        url: "/jobs/moderation/pending",
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "Moderation", id: "LIST" },
        ...(result?.data.jobs.map((job) => ({
          type: "Job" as const,
          id: job._id,
        })) ?? []),
      ],
    }),
    createJob: builder.mutation<JobMutationResponse, CreateJobPayload>({
      query: (body) => ({
        url: "/jobs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RecruiterJobs", "Moderation", "Jobs"],
    }),
    updateJob: builder.mutation<JobMutationResponse, UpdateJobPayload>({
      query: ({ jobId, data }) => ({
        url: `/jobs/${jobId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Job", id: jobId },
        { type: "RecruiterJobs", id: "LIST" },
        { type: "Moderation", id: "LIST" },
        { type: "Jobs", id: "LIST" },
      ],
    }),
    closeJob: builder.mutation<JobMutationResponse, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/close`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Job", id: jobId },
        { type: "RecruiterJobs", id: "LIST" },
        { type: "Jobs", id: "LIST" },
      ],
    }),
    deleteJob: builder.mutation<JobActionResponse, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Job", id: jobId },
        { type: "RecruiterJobs", id: "LIST" },
        { type: "Moderation", id: "LIST" },
        { type: "Jobs", id: "LIST" },
        { type: "SavedJobs", id: "LIST" },
      ],
    }),
    reviewJob: builder.mutation<JobMutationResponse, ReviewJobPayload>({
      query: ({ jobId, ...body }) => ({
        url: `/jobs/moderation/${jobId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [
        { type: "Job", id: jobId },
        { type: "Moderation", id: "LIST" },
        { type: "Jobs", id: "LIST" },
      ],
    }),
    removeJobByAdmin: builder.mutation<JobActionResponse, string>({
      query: (jobId) => ({
        url: `/jobs/admin/${jobId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Job", id: jobId },
        { type: "Moderation", id: "LIST" },
        { type: "Jobs", id: "LIST" },
        { type: "SavedJobs", id: "LIST" },
      ],
    }),
    saveJob: builder.mutation<JobActionResponse, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/save`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Job", id: jobId },
        { type: "Jobs", id: "LIST" },
        { type: "SavedJobs", id: "LIST" },
      ],
    }),
    unsaveJob: builder.mutation<JobActionResponse, string>({
      query: (jobId) => ({
        url: `/jobs/${jobId}/save`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Job", id: jobId },
        { type: "Jobs", id: "LIST" },
        { type: "SavedJobs", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetJobsQuery,
  useGetJobByIdQuery,
  useGetSavedJobsQuery,
  useGetMyJobsQuery,
  useGetPendingJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useCreateJobMutation,
  useUpdateJobMutation,
  useCloseJobMutation,
  useDeleteJobMutation,
  useReviewJobMutation,
  useRemoveJobByAdminMutation,
} = jobsApi;
