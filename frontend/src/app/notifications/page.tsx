"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/redux/features/notifications/notificationsApi";
import { formatNotificationDate, getNotificationDestination } from "@/lib/notifications";
import type { AppNotification } from "@/types/notification.types";

const PAGE_SIZE = 15;

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  isUpdating,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const destination = getNotificationDestination(notification);
  const content = (
    <>
      <span className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-semibold text-slate-900">{notification.title}</span>
        <time className="shrink-0 text-xs text-slate-400">{formatNotificationDate(notification.createdAt)}</time>
      </span>
      <span className="mt-1 block text-sm leading-6 text-slate-600">{notification.message}</span>
      {destination && <span className="mt-2 inline-block text-sm font-semibold text-primary-800">View details <span aria-hidden="true">→</span></span>}
    </>
  );

  return (
    <article className={`flex gap-3 rounded-2xl border p-4 transition sm:gap-4 sm:p-5 ${notification.isRead ? "border-slate-200 bg-white" : "border-primary-100 bg-white shadow-sm shadow-primary-900/[0.03]"}`}>
      <span aria-hidden="true" className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary-600"}`} />
      <div className="min-w-0 flex-1">
        {destination ? (
          <Link href={destination} onClick={() => { if (!notification.isRead) onMarkRead(notification._id); }} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
            {content}
          </Link>
        ) : (
          <div>{content}</div>
        )}
        <div className="mt-3 flex items-center gap-3">
          {!notification.isRead && (
            <button type="button" disabled={isUpdating} onClick={() => onMarkRead(notification._id)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 disabled:opacity-50">Mark as read</button>
          )}
          <button type="button" disabled={isUpdating} onClick={() => onDelete(notification._id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { currentData, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    unreadOnly,
  });
  const [markRead, { isLoading: isMarking }] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
  const result = currentData?.data;
  const isUpdating = isMarking || isMarkingAll || isDeleting;

  useEffect(() => {
    if (!result || isFetching) return;
    const lastAvailablePage = Math.max(1, result.pagination.totalPages);
    if (page > lastAvailablePage) setPage(lastAvailablePage);
  }, [isFetching, page, result]);

  const perform = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  const handleMarkRead = (id: string) => {
    void perform(() => markRead(id).unwrap(), "Notification marked as read.");
  };

  const handleDelete = (id: string) => {
    void perform(() => deleteNotification(id).unwrap(), "Notification deleted.");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/feed" className="text-sm font-medium text-slate-500 transition hover:text-primary-800">← Back to feed</Link>

          <header className="my-6 flex flex-col gap-5 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-xl shadow-primary-950/10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div>
              <p className="text-sm font-medium text-primary-100">Your activity, all in one place</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="mt-2 text-sm text-primary-100">{result?.unreadCount ?? 0} unread</p>
            </div>
            <button type="button" disabled={!result?.unreadCount || isUpdating} onClick={() => void perform(() => markAllRead().unwrap(), "All notifications marked as read.")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-900 shadow-sm transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50">
              {isMarkingAll ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCheck size={16} />}
              Mark all as read
            </button>
          </header>

          <div className="mb-4 flex items-center justify-between gap-4">
            <button type="button" onClick={() => { setUnreadOnly((value) => !value); setPage(1); }} aria-pressed={unreadOnly} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${unreadOnly ? "bg-primary-800 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-800"}`}>
              {unreadOnly ? "Showing unread" : "Show unread only"}
            </button>
            {isFetching && <LoaderCircle aria-label="Refreshing notifications" className="animate-spin text-slate-400" size={17} />}
          </div>

          {isLoading && (
            <div role="status" aria-label="Loading notifications" className="space-y-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}
            </div>
          )}

          {isError && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-700">
              Could not load notifications. <button type="button" onClick={() => void refetch()} className="font-semibold underline underline-offset-2">Try again</button>
            </div>
          )}

          {!isLoading && !isError && result?.notifications.length === 0 && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-700"><Bell size={22} /></span>
              <h2 className="mt-4 font-bold text-slate-900">You’re all caught up</h2>
              <p className="mt-1 text-sm text-slate-500">New connection, post, and job activity will appear here.</p>
            </section>
          )}

          <div className="space-y-3">
            {result?.notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                isUpdating={isUpdating}
              />
            ))}
          </div>

          {result && result.pagination.totalPages > 1 && (
            <nav aria-label="Notification pages" className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-sm text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{result.pagination.totalPages}</strong></span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || isFetching} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
                <button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= result.pagination.totalPages || isFetching} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
              </div>
            </nav>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
