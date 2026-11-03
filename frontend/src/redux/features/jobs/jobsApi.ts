import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  JobActionResponse,
  JobListParams,
  JobPageResponse,
  JobResponse,
} from "@/types/job.types";

export const jobsApi = createApi({
  reducerPath: "jobsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Jobs", "SavedJobs", "Job"],
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
  useSaveJobMutation,
  useUnsaveJobMutation,
} = jobsApi;
