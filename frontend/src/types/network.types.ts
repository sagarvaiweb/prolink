import type { ApiResponse } from "./auth.types";

export interface NetworkPerson {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string | null;
  role: "student" | "professional" | "recruiter" | "admin";
}

export interface ConnectionSuggestion extends NetworkPerson {
  mutualConnectionsCount: number;
}

export interface ConnectionRecord {
  _id: string;
  requester: NetworkPerson;
  recipient: NetworkPerson;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConnectionPage {
  connections: ConnectionRecord[];
  pagination: Pagination;
}

export interface SuggestionsPage {
  suggestions: ConnectionSuggestion[];
  pagination: Pagination;
}

export interface FollowListUser extends NetworkPerson {
  followedAt: string;
}

export interface FollowPage {
  users: FollowListUser[];
  pagination: Pagination;
}

export type ConnectionRelationshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "connected"
  | "self";

export interface RelationshipStatus {
  connectionStatus: ConnectionRelationshipStatus;
  connectionId: string | null;
  isFollowing: boolean;
}

export interface FollowRecord {
  _id: string;
  follower: string;
  following: string;
  createdAt: string;
  updatedAt: string;
}

export type ConnectionPageResponse = ApiResponse<ConnectionPage>;
export type SuggestionsPageResponse = ApiResponse<SuggestionsPage>;
export type FollowPageResponse = ApiResponse<FollowPage>;
export type RelationshipStatusResponse = ApiResponse<RelationshipStatus>;
export type ConnectionActionResponse = ApiResponse<ConnectionRecord | null>;
export type FollowActionResponse = ApiResponse<FollowRecord | null>;
