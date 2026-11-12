import type { ApiResponse } from "@/types/auth.types";
import type { PostReportPage } from "@/types/post.types";
import type { CompanyListResponse, CompanySize } from "@/types/company.types";

export type AdminRole = "student" | "professional" | "recruiter" | "admin";
export type AdminAccountStatus = "active" | "inactive" | "suspended" | "deleted";

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: AdminRole;
  accountStatus: AdminAccountStatus;
  isEmailVerified: boolean;
  isVerified: boolean;
  avatar: string;
  createdAt: string;
  lastLogin: string | null;
}

export interface AdminUserPage {
  users: AdminUser[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminUserQuery {
  page: number;
  limit: number;
  search?: string;
  role?: AdminRole;
  status?: AdminAccountStatus;
}

export type AdminUsersResponse = ApiResponse<AdminUserPage>;

export type AdminReportAction = "dismiss" | "remove_content" | "warn_user" | "suspend_author" | "suspend_reporter";
export interface AdminReportsQuery {
  page: number;
  limit: number;
  status?: "pending" | "dismissed" | "actioned" | "post_removed";
  type?: "post";
}
export type AdminReportsResponse = ApiResponse<PostReportPage>;
export interface AdminCompanyReviewPayload {
  companyId: string;
  decision: "approve" | "reject";
  note?: string;
}
export type AdminPendingCompaniesQuery = {
  page: number;
  limit: number;
  search?: string;
  industry?: string;
  companySize?: CompanySize;
};
export type AdminPendingCompaniesResponse = CompanyListResponse;

export type AdminAction =
  | "report_dismissed" | "post_removed" | "user_warned" | "user_suspended"
  | "company_verified" | "company_rejected" | "company_suspended"
  | "user_reactivated" | "user_role_changed" | "user_verification_changed"
  | "user_status_changed" | "user_deleted" | "job_removed" | "other";
export type AdminTargetType = "user" | "company" | "post" | "job";

export interface AdminLogEntry {
  _id: string;
  admin: { firstName: string; lastName: string; username: string; avatar?: string } | string | null;
  action: AdminAction;
  targetType: AdminTargetType;
  targetId: string;
  note: string;
  createdAt: string;
}

export interface AdminLogPage {
  logs: AdminLogEntry[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminLogQuery {
  page: number;
  limit: number;
  action?: AdminAction;
  targetType?: AdminTargetType;
}

export type AdminLogResponse = ApiResponse<AdminLogPage>;
