"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  Home,
  LoaderCircle,
  Network,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import {
  getNotificationDestination,
  formatNotificationDate,
  getNotificationErrorMessage,
} from "@/lib/notifications";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { notificationsApi, useGetNotificationsQuery, useGetUnreadNotificationCountQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useDeleteNotificationMutation } from "@/redux/features/notifications/notificationsApi";
import type { AppNotification } from "@/types/notification.types";

const RECENT_LIMIT = 5;

function getSocketOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return window.location.origin;

  try {
    return new URL(apiUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function isNotification(value: unknown): value is AppNotification {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppNotification>;
  return Boolean(
    candidate._id &&
      candidate.title &&
      candidate.message &&
      candidate.createdAt &&
      candidate.type
  );
}

export default function NotificationCenter() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !accessToken,
  });
  const {
    currentData,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetNotificationsQuery(
    { page: 1, limit: RECENT_LIMIT },
    { skip: !accessToken }
  );
  const [markRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(getSocketOrigin(), {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelayMax: 5000,
    });

    const refreshNotifications = () => {
      dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
    };

    socket.on("connect_error", (error) => {
      console.error("Realtime notifications could not connect:", error.message);
    });
    socket.on("connect", refreshNotifications);
    socket.on("notification:new", (payload: unknown) => {
      if (!isNotification(payload)) return;
      refreshNotifications();
      toast(payload.title, { description: payload.message });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!accessToken) return null;

  const notifications = currentData?.data.notifications ?? [];
  const unreadCount = unreadData?.data.unreadCount ?? currentData?.data.unreadCount ?? 0;

  const openNotification = async (notification: AppNotification) => {
    if (!notification.isRead) {
      try {
        await markRead(notification._id).unwrap();
      } catch (error) {
        toast.error(getJobErrorMessage(error));
      }
    }

    setIsOpen(false);
    const destination = getNotificationDestination(notification);
    if (destination) router.push(destination);
    else router.push("/notifications");
  };

  const markAll = async () => {
    try {
      await markAllRead().unwrap();
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  const removeNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId).unwrap();
      toast.success("Notification removed.");
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.02] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/feed" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-800 text-sm font-black text-white shadow-sm">P</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">ProLink</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/feed" aria-label="Feed" className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3"><Home size={17} /><span className="hidden sm:inline">Feed</span></Link>
          <Link href="/network" aria-label="Network" className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3"><Network size={17} /><span className="hidden sm:inline">Network</span></Link>
          <Link href="/jobs" aria-label="Jobs" className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:px-3"><BriefcaseBusiness size={17} /><span className="hidden sm:inline">Jobs</span></Link>
        </nav>

        <div className="relative" ref={rootRef}>
          <button
            type="button"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            onClick={() => setIsOpen((open) => !open)}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <section aria-label="Recent notifications" role="dialog" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <div>
                  <h2 className="font-semibold text-slate-900">Notifications</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{unreadCount} unread</p>
                </div>
                <button type="button" disabled={!unreadCount || isMarkingAllRead} onClick={() => void markAll()} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
                  {isMarkingAllRead ? <LoaderCircle className="animate-spin" size={14} /> : <CheckCheck size={14} />}
                  Mark all read
                </button>
              </div>

              <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
                {isError ? (
                  <div role="alert" className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-600">{getNotificationErrorMessage(error)}</p>
                    <button type="button" onClick={() => void refetch()} className="mt-2 rounded-lg px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50">Try again</button>
                  </div>
                ) : isFetching && notifications.length === 0 ? (
                  <div role="status" className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Loading notifications</div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center"><Bell className="mx-auto text-slate-300" size={25} /><p className="mt-3 text-sm font-semibold text-slate-800">You’re all caught up</p><p className="mt-1 text-xs text-slate-500">New activity will show up here.</p></div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className={`group flex items-start gap-2 rounded-xl p-3 transition ${notification.isRead ? "hover:bg-slate-50" : "bg-primary-50/70 hover:bg-primary-50"}`}>
                      <button type="button" onClick={() => void openNotification(notification)} className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-primary-700">
                        <span className="flex items-start gap-2.5">
                          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary-600"}`} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{notification.title}</span>
                            <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-600">{notification.message}</span>
                            <span className="mt-1.5 block text-[11px] text-slate-400">{formatNotificationDate(notification.createdAt)}</span>
                          </span>
                        </span>
                      </button>
                      <button type="button" aria-label="Delete notification" disabled={isDeleting} onClick={() => void removeNotification(notification._id)} className="rounded-lg p-2 text-slate-400 opacity-100 transition hover:bg-white hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-600 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><Trash2 size={15} /></button>
                    </div>
                  ))
                )}
              </div>

              <Link href="/notifications" onClick={() => setIsOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-primary-800 transition hover:bg-primary-50">View all notifications</Link>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
