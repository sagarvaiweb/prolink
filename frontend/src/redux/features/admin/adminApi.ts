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
} from "@/types/admin.types";
import type { ApiResponse } from "@/types/auth.types";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminUsers", "AdminLogs"],
  endpoints: (builder) => ({
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
  useGetAdminUsersQuery,
  useUpdateAdminUserRoleMutation,
  useUpdateAdminUserStatusMutation,
  useGetAdminLogsQuery,
} = adminApi;

export type { AdminAction, AdminTargetType };
