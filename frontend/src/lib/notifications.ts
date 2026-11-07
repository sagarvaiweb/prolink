import type { AppNotification } from "@/types/notification.types";

export function getNotificationDestination(
  notification: AppNotification
): string | null {
  switch (notification.type) {
    case "job_application_received":
      return notification.relatedJobId
        ? `/recruiter/jobs/${notification.relatedJobId}/applicants`
        : null;
    case "application_status_updated":
      return "/applications";
    case "connection_request":
    case "connection_accepted":
      return "/network";
    case "post_like":
    case "post_comment":
      return notification.relatedPostId
        ? `/posts/${notification.relatedPostId}`
        : null;
    case "job_listing_removed":
      return "/jobs";
    default:
      return notification.relatedJobId
        ? `/jobs/${notification.relatedJobId}`
        : null;
  }
}

export function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
