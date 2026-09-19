import type { User } from "./auth.types";

export type SafeUserProfile = Pick<
  User,
  "_id" | "firstName" | "lastName" | "username" | "role"
> & {
  avatar: string;
};

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export type NetworkingContext =
  | "connections"
  | "receivedRequests"
  | "sentRequests"
  | "suggestions"
  | "followers"
  | "following";

export interface Connection {
  _id: string;
  requester: string;
  recipient: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionListItem {
  _id: string;
  user: SafeUserProfile | null;
  connectedAt: string | null;
}

export interface ConnectionRequestItem {
  _id: string;
  requester?: SafeUserProfile | null;
  recipient?: SafeUserProfile | null;
  createdAt: string;
}

export interface ConnectionPagination {
  currentPage: number;
  limit: number;
  totalConnections: number;
  totalPages: number;
}

export interface RequestPagination {
  currentPage: number;
  limit: number;
  totalRequests: number;
  totalPages: number;
}

export interface UserPagination {
  currentPage: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

export interface ConnectionListData {
  connections: ConnectionListItem[];
  pagination: ConnectionPagination;
}

export interface ReceivedConnectionRequestsData {
  requests: Array<ConnectionRequestItem & { requester: SafeUserProfile | null }>;
  pagination: RequestPagination;
}

export interface SentConnectionRequestsData {
  requests: Array<ConnectionRequestItem & { recipient: SafeUserProfile | null }>;
  pagination: RequestPagination;
}

export interface PendingRequestCountData {
  count: number;
}

export interface ConnectionStatusData {
  status: "none" | "pending_sent" | "pending_received" | "accepted";
}

export interface Follow {
  _id: string;
  follower: string;
  following: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowListData {
  users: SafeUserProfile[];
  pagination: UserPagination;
}

export interface FollowStatusData {
  isFollowing: boolean;
}

export interface FollowCountData {
  followersCount: number;
  followingCount: number;
}

export interface SendConnectionRequestPayload {
  recipient: string;
}

export interface ConnectionRequestActionPayload {
  connectionId: string;
}
