import type { ApiResponse } from "./auth.types";
import type { JobPagination } from "./job.types";

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "new_follower"
  | "post_like"
  | "post_comment"
  | "job_application_received"
  | "application_status_updated"
  | "job_listing_removed";

export interface NotificationActor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

export interface AppNotification {
  _id: string;
  actor?: NotificationActor | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedJobId?: string | null;
  relatedApplicationId?: string | null;
  relatedConnectionId?: string | null;
  relatedPostId?: string | null;
  relatedCommentId?: string | null;
  jobTitle?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPage {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: JobPagination;
}

export type NotificationPageResponse = ApiResponse<NotificationPage>;
export type NotificationActionResponse = ApiResponse<null>;
export type UnreadNotificationCountResponse = ApiResponse<{
  unreadCount: number;
}>;
