import type { ApiResponse } from "./auth.types";
import type { JobPagination } from "./job.types";

export type NotificationType = "job_application_received" | "application_status_updated" | "job_listing_removed";

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
