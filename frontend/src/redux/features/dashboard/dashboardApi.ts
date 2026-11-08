import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  ApplicationsSummaryResponse,
  DashboardRange,
  NetworkGrowthResponse,
  PostEngagementResponse,
  ProfileViewsResponse,
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
  }),
});

export const {
  useGetProfileViewsQuery,
  useGetPostEngagementQuery,
  useGetNetworkGrowthQuery,
  useGetApplicationsSummaryQuery,
} = dashboardApi;
