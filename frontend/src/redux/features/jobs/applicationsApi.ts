import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type { ApplicationActionResponse, ApplicationPageResponse, ApplicationResponse, ApplicationStatus } from "@/types/application.types";

export const applicationsApi = createApi({
  reducerPath: "applicationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Applications", "Applicants"],
  endpoints: (builder) => ({
    getMyApplications: builder.query<ApplicationPageResponse, { page: number; limit: number }>({
      query: (params) => ({ url: "/applications/me", params }),
      providesTags: ["Applications"],
    }),
    applyToJob: builder.mutation<ApplicationResponse, string>({
      query: (jobId) => ({ url: `/jobs/${jobId}/apply`, method: "POST" }),
      invalidatesTags: ["Applications"],
    }),
    withdrawApplication: builder.mutation<ApplicationActionResponse, string>({
      query: (applicationId) => ({ url: `/applications/${applicationId}`, method: "DELETE" }),
      invalidatesTags: ["Applications"],
    }),
    getJobApplicants: builder.query<ApplicationPageResponse, { jobId: string; page: number; limit: number }>({
      query: ({ jobId, page, limit }) => ({ url: `/jobs/${jobId}/applicants`, params: { page, limit } }),
      providesTags: (_result, _error, { jobId }) => [{ type: "Applicants", id: jobId }],
    }),
    updateApplicationStatus: builder.mutation<ApplicationResponse, { applicationId: string; status: Extract<ApplicationStatus, "shortlisted" | "rejected" | "hired">; jobId: string }>({
      query: ({ applicationId, status }) => ({ url: `/applications/${applicationId}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Applicants", id: jobId }],
    }),
  }),
});

export const { useGetMyApplicationsQuery, useApplyToJobMutation, useWithdrawApplicationMutation, useGetJobApplicantsQuery, useUpdateApplicationStatusMutation } = applicationsApi;
