import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  AdminAction,
  AdminLogQuery,
  AdminLogResponse,
  AdminRole,
  AdminTargetType,
  AdminUserQuery,
  AdminUsersResponse,
  AdminAccountStatus,
  AdminUser,
  AdminReportAction,
  AdminReportsQuery,
  AdminReportsResponse,
  AdminCompanyReviewPayload,
  AdminPendingCompaniesQuery,
  AdminPendingCompaniesResponse,
} from "@/types/admin.types";
import type { ApiResponse } from "@/types/auth.types";
import type { PostReport } from "@/types/post.types";
import type { Company, CompanyStatusChangeResponse } from "@/types/company.types";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminUsers", "AdminLogs", "AdminReports", "AdminCompanies"],
  endpoints: (builder) => ({
    getAdminReports: builder.query<AdminReportsResponse, AdminReportsQuery>({
      query: (params) => ({ url: "/admin/reports", params }),
      providesTags: (result) => [
        { type: "AdminReports", id: "LIST" },
        ...(result?.data.reports.map(({ _id }) => ({ type: "AdminReports" as const, id: _id })) ?? []),
      ],
    }),
    reviewAdminReport: builder.mutation<ApiResponse<PostReport>, { reportId: string; action: AdminReportAction; note?: string }>({
      query: ({ reportId, ...body }) => ({ url: `/admin/reports/${reportId}/action`, method: "PATCH", body }),
      invalidatesTags: [
        { type: "AdminReports", id: "LIST" },
        { type: "AdminLogs", id: "LIST" },
        { type: "AdminUsers", id: "LIST" },
      ],
    }),
    getAdminPendingCompanies: builder.query<AdminPendingCompaniesResponse, AdminPendingCompaniesQuery>({
      query: (params) => ({ url: "/admin/companies/pending", params }),
      providesTags: [{ type: "AdminCompanies", id: "PENDING" }],
    }),
    reviewAdminCompany: builder.mutation<ApiResponse<Company>, AdminCompanyReviewPayload>({
      query: ({ companyId, ...body }) => ({ url: `/admin/companies/${companyId}/verification`, method: "PATCH", body }),
      invalidatesTags: [{ type: "AdminCompanies", id: "PENDING" }, { type: "AdminLogs", id: "LIST" }],
    }),
    suspendAdminCompany: builder.mutation<CompanyStatusChangeResponse, string>({
      query: (companyId) => ({ url: `/admin/companies/${companyId}/suspend`, method: "PATCH" }),
      invalidatesTags: [{ type: "AdminCompanies", id: "PENDING" }, { type: "AdminLogs", id: "LIST" }],
    }),
    getAdminUsers: builder.query<AdminUsersResponse, AdminUserQuery>({
      query: (params) => ({ url: "/admin/users", params }),
      providesTags: (result) => [
        { type: "AdminUsers", id: "LIST" },
        ...(result?.data.users.map(({ _id }) => ({ type: "AdminUsers" as const, id: _id })) ?? []),
      ],
    }),
    updateAdminUserRole: builder.mutation<ApiResponse<AdminUser>, { id: string; role: AdminRole }>({
      query: ({ id, role }) => ({ url: `/admin/users/${id}/role`, method: "PATCH", body: { role } }),
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }, { type: "AdminLogs", id: "LIST" }],
    }),
    updateAdminUserStatus: builder.mutation<ApiResponse<AdminUser>, { id: string; accountStatus: AdminAccountStatus }>({
      query: ({ id, accountStatus }) => ({ url: `/admin/users/${id}/status`, method: "PATCH", body: { accountStatus } }),
      invalidatesTags: [{ type: "AdminUsers", id: "LIST" }, { type: "AdminLogs", id: "LIST" }],
    }),
    getAdminLogs: builder.query<AdminLogResponse, AdminLogQuery>({
      query: (params) => ({ url: "/admin/logs", params }),
      providesTags: [{ type: "AdminLogs", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminReportsQuery,
  useReviewAdminReportMutation,
  useGetAdminPendingCompaniesQuery,
  useReviewAdminCompanyMutation,
  useSuspendAdminCompanyMutation,
  useGetAdminUsersQuery,
  useUpdateAdminUserRoleMutation,
  useUpdateAdminUserStatusMutation,
  useGetAdminLogsQuery,
} = adminApi;

export type { AdminAction, AdminTargetType };
