import type { SafeUserProfile, PaginationParams } from "./networking.types";

export type NotificationType =
  | "connection_request_received"
  | "connection_request_accepted"
  | "connection_request_rejected"
  | "follow_received";

export interface Notification {
  _id: string;
  actor: SafeUserProfile | null;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPagination {
  currentPage: number;
  limit: number;
  totalNotifications: number;
  totalPages: number;
}

export interface NotificationsData {
  notifications: Notification[];
  pagination: NotificationPagination;
}

export interface UnreadNotificationCountData {
  count: number;
}

export interface MarkNotificationReadPayload {
  notificationId: string;
}

export type NotificationPaginationParams = PaginationParams;
