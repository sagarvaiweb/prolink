import type { AppNotification } from "@/types/notification.types";

export function getNotificationErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Could not load notifications. Please try again.";
  }

  const apiError = error as {
    status?: number | string;
    data?: { message?: unknown; errors?: unknown };
    error?: string;
  };
  const apiMessage =
    typeof apiError.data?.message === "string"
      ? apiError.data.message
      : Array.isArray(apiError.data?.errors) &&
          typeof apiError.data.errors[0] === "string"
        ? apiError.data.errors[0]
        : null;

  if (apiMessage) return apiMessage;
  if (apiError.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (typeof apiError.error === "string") {
    return `Could not reach the notification service: ${apiError.error}`;
  }
  if (typeof apiError.status === "number") {
    return `The notification service returned HTTP ${apiError.status}.`;
  }

  return "Could not load notifications. Please try again.";
}

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
