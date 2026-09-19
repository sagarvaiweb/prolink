import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/features/auth/authApi";
import type { ApiResponse } from "@/types/auth.types";
import type {
  MarkNotificationReadPayload,
  Notification,
  NotificationPaginationParams,
  NotificationsData,
  UnreadNotificationCountData,
} from "@/types/notification.types";

export const notificationApi = createApi({
  reducerPath: "notificationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notification", "UnreadNotificationCount"],
  endpoints: (builder) => ({
    getNotifications: builder.query<
      ApiResponse<NotificationsData>,
      NotificationPaginationParams | void
    >({
      query: (params) => ({
        url: "/notifications",
        params: params ?? undefined,
      }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadNotificationCount: builder.query<ApiResponse<UnreadNotificationCountData>, void>({
      query: () => "/notifications/unread-count",
      providesTags: [{ type: "UnreadNotificationCount", id: "COUNT" }],
    }),
    markNotificationAsRead: builder.mutation<
      ApiResponse<Notification>,
      MarkNotificationReadPayload
    >({
      query: ({ notificationId }) => ({
        url: `/notifications/${notificationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "UnreadNotificationCount", id: "COUNT" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
} = notificationApi;
