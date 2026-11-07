import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  NotificationActionResponse,
  NotificationPageResponse,
  UnreadNotificationCountResponse,
} from "@/types/notification.types";

export interface NotificationListParams {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationPageResponse, NotificationListParams>({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: builder.query<UnreadNotificationCountResponse, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<NotificationActionResponse, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<NotificationActionResponse, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotification: builder.mutation<NotificationActionResponse, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
