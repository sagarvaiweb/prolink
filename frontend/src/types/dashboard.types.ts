import type { ApiResponse } from "./auth.types";

export type DashboardRange = "7d" | "30d" | "90d" | "all";

export interface ProfileViewsAnalytics {
  total: number;
  allTimeTotal?: number;
  series: Array<{ date: string; count: number }>;
}

export interface PostEngagementAnalytics {
  totals: {
    posts: number;
    likes: number;
    comments: number;
    shares: number;
  };
  series: Array<{
    date: string;
    posts: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}

export interface NetworkGrowthAnalytics {
  totals: {
    connections: number;
    followers: number;
  };
  series: Array<{
    date: string;
    connections: number;
    followers: number;
  }>;
}

export type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "hired";

export interface ApplicationsSummary {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
}

export type ProfileViewsResponse = ApiResponse<ProfileViewsAnalytics>;
export type PostEngagementResponse = ApiResponse<PostEngagementAnalytics>;
export type NetworkGrowthResponse = ApiResponse<NetworkGrowthAnalytics>;
export type ApplicationsSummaryResponse = ApiResponse<ApplicationsSummary>;
