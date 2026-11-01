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

export type ConnectionPageResponse = ApiResponse<ConnectionPage>;
export type SuggestionsPageResponse = ApiResponse<SuggestionsPage>;
export type ConnectionActionResponse = ApiResponse<ConnectionRecord | null>;
