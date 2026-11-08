import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  ApplicationsSummaryResponse,
  AdminPlatformStatsResponse,
  DashboardRange,
  NetworkGrowthResponse,
  PostEngagementResponse,
  ProfileViewsResponse,
  RecruiterJobFunnelResponse,
  RecruiterJobsOverviewResponse,
} from "@/types/dashboard.types";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getProfileViews: builder.query<ProfileViewsResponse, DashboardRange>({
      query: (range) => ({
        url: "/dashboard/profile-views",
        params: { range },
      }),
    }),
    getPostEngagement: builder.query<PostEngagementResponse, DashboardRange>({
      query: (range) => ({
        url: "/dashboard/post-engagement",
        params: { range },
      }),
    }),
    getNetworkGrowth: builder.query<NetworkGrowthResponse, DashboardRange>({
      query: (range) => ({
        url: "/dashboard/network-growth",
        params: { range },
      }),
    }),
    getApplicationsSummary: builder.query<ApplicationsSummaryResponse, void>({
      query: () => "/dashboard/applications-summary",
    }),
    getRecruiterJobsOverview: builder.query<RecruiterJobsOverviewResponse, void>({
      query: () => "/dashboard/recruiter/jobs-overview",
    }),
    getRecruiterJobFunnel: builder.query<RecruiterJobFunnelResponse, string>({
      query: (jobId) => `/dashboard/recruiter/${jobId}/funnel`,
    }),
    getAdminPlatformStats: builder.query<AdminPlatformStatsResponse, DashboardRange>({
      query: (range) => ({
        url: "/dashboard/admin/platform-stats",
        params: { range },
      }),
    }),
  }),
});

export const {
  useGetProfileViewsQuery,
  useGetPostEngagementQuery,
  useGetNetworkGrowthQuery,
  useGetApplicationsSummaryQuery,
  useGetRecruiterJobsOverviewQuery,
  useGetRecruiterJobFunnelQuery,
  useGetAdminPlatformStatsQuery,
} = dashboardApi;
