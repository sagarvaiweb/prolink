import type { ApiResponse } from "./auth.types";

export interface NetworkPerson {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  role: "student" | "professional" | "recruiter" | "admin";
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

export type ConnectionPageResponse = ApiResponse<ConnectionPage>;
export type ConnectionActionResponse = ApiResponse<ConnectionRecord | null>;
