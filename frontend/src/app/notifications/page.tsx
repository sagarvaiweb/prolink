"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import NetworkingAvatar from "@/components/networking/NetworkingAvatar";
import {
  NetworkingCardSkeleton,
  NetworkingEmptyState,
  NetworkingErrorState,
} from "@/components/networking/NetworkingStates";
import { getNetworkingErrorMessage } from "@/components/networking/networking.utils";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationAsReadMutation,
} from "@/redux/features/notification/notificationApi";
import type { Notification, NotificationType } from "@/types/notification.types";

const PAGE_SIZE = 10;

const destinationByType: Partial<Record<NotificationType, string>> = {
  connection_request_received: "/network/requests/received",
  connection_request_accepted: "/network",
  connection_request_rejected: "/network",
  follow_received: "/network/followers",
};

const formatExactTime = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatRelativeTime = (createdAt: string) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Recently";

  const elapsedMilliseconds = Date.now() - date.getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMilliseconds / 60_000));
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h`;
  if (elapsedHours < 48) return "Yesterday";

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d`;

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
};

const getNotificationMessage = (type: NotificationType, actorName: string) => {
  switch (type) {
    case "connection_request_received":
      return `${actorName} sent you a connection request.`;
    case "connection_request_accepted":
      return `${actorName} accepted your connection request.`;
    case "connection_request_rejected":
      return `${actorName} declined your connection request.`;
    case "follow_received":
      return `${actorName} started following you.`;
  }
};

function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter();
  const [markNotificationAsRead, { isLoading }] = useMarkNotificationAsReadMutation();
  const destination = destinationByType[notification.type];
  const actor = notification.actor;
  const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() || "Someone" : "Someone";
  const notificationMessage = getNotificationMessage(notification.type, actorName);
  const exactTime = formatExactTime(notification.createdAt);

  const handleClick = async () => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead({ notificationId: notification._id }).unwrap();
      } catch (error) {
        toast.error(getNetworkingErrorMessage(error, "Unable to mark this notification as read."));
        return;
      }
    }

    if (destination) router.push(destination);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${
        notification.isRead
          ? "border-gray-100 bg-white hover:bg-gray-50"
          : "border-blue-100 bg-blue-50/70 hover:bg-blue-50"
      }`}
      aria-label={`${notification.isRead ? "Read" : "Unread"} notification: ${notificationMessage}`}
    >
      {actor ? (
        <NetworkingAvatar
          avatar={actor.avatar}
          firstName={actor.firstName}
          lastName={actor.lastName}
          size="md"
        />
      ) : (
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800">
          <Bell size={21} aria-hidden="true" />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-gray-900">{actorName}</span>
          {!notification.isRead && (
            <span className="inline-flex items-center gap-1.5" aria-label="Unread">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-700" aria-hidden="true" />
              <span className="sr-only">Unread</span>
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-6 text-gray-700">{notificationMessage}</span>
        <time
          dateTime={notification.createdAt}
          title={exactTime || undefined}
          className="mt-2 block text-xs text-gray-500"
        >
          {formatRelativeTime(notification.createdAt)}
        </time>
      </span>

      {notification.isRead && (
        <CheckCircle2 className="mt-0.5 shrink-0 text-gray-400" size={18} aria-label="Read" />
      )}
    </button>
  );
}

function NotificationsContent() {
  const [page, setPage] = useState(1);
  const { data, error, isError, isFetching, isLoading, refetch } = useGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
  });
  const notificationData = data?.data;
  const isInitialLoading = isLoading && !notificationData;

  if (isInitialLoading) return <NetworkingCardSkeleton count={4} />;

  if (isError && !notificationData) {
    return (
      <NetworkingErrorState
        message={getNetworkingErrorMessage(error, "Unable to load your notifications.")}
        onRetry={refetch}
      />
    );
  }

  if (!notificationData || notificationData.pagination.totalNotifications === 0) {
    return (
      <NetworkingEmptyState
        title="No notifications yet"
        description="Updates about your network activity will appear here."
      />
    );
  }

  const { notifications, pagination } = notificationData;
  const hasPreviousPage = page > 1;
  const hasNextPage = pagination.currentPage < pagination.totalPages;

  return (
    <div className="space-y-5">
      {isError && (
        <NetworkingErrorState
          message={getNetworkingErrorMessage(error, "Unable to refresh your notifications.")}
          onRetry={refetch}
        />
      )}

      <div className="grid gap-3">
        {notifications.map((notification) => (
          <NotificationItem key={notification._id} notification={notification} />
        ))}
      </div>

      <nav
        aria-label="Notifications pagination"
        className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <p className="text-sm text-gray-500" aria-live="polite">
          Page {pagination.currentPage} of {pagination.totalPages} &middot;{" "}
          {pagination.totalNotifications} notifications
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={!hasPreviousPage || isFetching}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={!hasNextPage || isFetching}
            className="rounded-xl bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-900 active:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Next"}
          </button>
        </div>
      </nav>
    </div>
  );
}

function NotificationsPageContent() {
  const { data } = useGetUnreadNotificationCountQuery();
  const unreadCount = data?.data.count ?? 0;

  return (
    <main className="min-h-full bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-800">Your ProLink activity</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Notifications
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Keep up with connection requests and activity in your professional network.
            </p>
          </div>
          <span
            className="relative inline-flex shrink-0 rounded-2xl border border-blue-100 bg-white p-3 text-blue-800 shadow-sm"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={23} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
        </header>
        <NotificationsContent />
      </div>
    </main>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}
