"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  Bell,
  BriefcaseBusiness,
  CheckCheck,
  ChevronDown,
  Compass,
  Home,
  LoaderCircle,
  LogOut,
  Network,
  Search,
  UserRound,
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
import { clearCredentials } from "@/redux/features/auth/authSlice";
import { authApi, useLogoutMutation } from "@/redux/features/auth/authApi";
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

function AccountAvatar({
  src,
  initials,
  size = "compact",
}: {
  src?: string;
  initials: string;
  size?: "compact" | "large";
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const isLarge = size === "large";
  const hasImageError = src === failedSource;

  return (
    <span
      className={`relative isolate grid shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#e9d9ad] via-[#fffaf0] to-[#b99a5a] p-0.5 shadow-[0_4px_12px_rgba(15,23,42,0.16)] ${isLarge ? "h-14 w-14" : "h-9 w-9"}`}
    >
      {src && !hasImageError ? (
        <img
          src={src}
          alt=""
          width={isLarge ? 56 : 36}
          height={isLarge ? 56 : 36}
          onError={() => setFailedSource(src)}
          className={`block h-full w-full min-h-0 min-w-0 max-h-full max-w-full rounded-full border-2 border-white object-cover object-center ${isLarge ? "ring-1 ring-slate-900/10" : ""}`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center rounded-full border-2 border-white bg-linear-to-br from-slate-900 to-slate-700 font-semibold tracking-wide text-[#f4e4bd] ${isLarge ? "text-base" : "text-[11px]"}`}
        >
          {initials}
        </span>
      )}
    </span>
  );
}

export default function NotificationCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const isPublicPage =
    pathname === "/" || pathname === "/auth" || pathname.startsWith("/auth/");
  const shouldShowHeader = Boolean(accessToken && !isPublicPage);
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const refreshInProgress = useRef(false);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !shouldShowHeader,
  });
  const {
    currentData,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetNotificationsQuery(
    { page: 1, limit: RECENT_LIMIT },
    { skip: !shouldShowHeader }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation();
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  useEffect(() => {
    if (!shouldShowHeader) return;

    const socket = io(getSocketOrigin(), {
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelayMax: 5000,
    });

    const refreshNotifications = () => {
      dispatch(notificationsApi.util.invalidateTags(["Notifications"]));
    };

    socket.on("connect_error", (error) => {
      if (
        error.message === "Invalid or expired access token." &&
        !refreshInProgress.current
      ) {
        refreshInProgress.current = true;
        void dispatch(
          authApi.endpoints.getCurrentUser.initiate(undefined, {
            forceRefetch: true,
            subscribe: false,
          })
        )
          .unwrap()
          .catch(() => undefined)
          .finally(() => {
            refreshInProgress.current = false;
          });
      }
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
  }, [accessToken, dispatch, shouldShowHeader]);

  useEffect(() => {
    if (!isOpen && !isAccountMenuOpen && !isExploreOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
      if (!accountRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false);
      if (!exploreRef.current?.contains(event.target as Node)) setIsExploreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsAccountMenuOpen(false);
        setIsExploreOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen, isExploreOpen, isOpen]);

  if (!shouldShowHeader) return null;

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

  const signOut = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Clear the local session even when the server cannot be reached.
    } finally {
      dispatch(clearCredentials());
      setIsAccountMenuOpen(false);
      router.replace("/auth/login");
      toast.success("You have been signed out.");
    }
  };

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Your account";
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "U"
    : "U";
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Member";
  const isFeedActive = pathname === "/feed";
  const isSearchActive = pathname.startsWith("/search");
  const isNetworkActive = pathname.startsWith("/network");
  const isJobsActive = pathname.startsWith("/jobs");
  const isExploreActive = isNetworkActive || isJobsActive;

  const navigationLinkClass = (isActive: boolean) =>
    `flex h-9 w-9 items-center justify-center gap-2 rounded-xl px-0 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 sm:w-auto sm:px-3 sm:text-sm ${
      isActive
        ? "bg-white text-primary-800 shadow-sm ring-1 ring-slate-200/70"
        : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/2 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-800 text-sm font-black text-white shadow-sm">P</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">ProLink</span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1">
          <Link href="/feed" aria-label="Feed" aria-current={isFeedActive ? "page" : undefined} onClick={() => setIsExploreOpen(false)} className={navigationLinkClass(isFeedActive)}>
            <Home size={17} />
            <span className="hidden sm:inline">Feed</span>
          </Link>
          <Link href="/search" aria-label="Search" aria-current={isSearchActive ? "page" : undefined} onClick={() => setIsExploreOpen(false)} className={navigationLinkClass(isSearchActive)}>
            <Search size={17} />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <div className="relative" ref={exploreRef}>
            <button
              type="button"
              aria-label="Explore network and jobs"
              aria-expanded={isExploreOpen}
              aria-haspopup="menu"
              aria-controls="explore-menu"
              onClick={() => setIsExploreOpen((open) => !open)}
              className={navigationLinkClass(isExploreActive || isExploreOpen)}
            >
              <Compass size={17} />
              <span className="hidden sm:inline">Explore</span>
              <ChevronDown size={14} className={`hidden transition sm:block ${isExploreOpen ? "rotate-180" : ""}`} />
            </button>
            {isExploreOpen && (
              <div id="explore-menu" role="menu" aria-label="Explore" className="absolute left-1/2 top-[calc(100%+0.75rem)] z-50 w-[min(15rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15 sm:left-0 sm:w-60 sm:translate-x-0">
                <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Discover</p>
                <Link href="/network" role="menuitem" aria-current={isNetworkActive ? "page" : undefined} onClick={() => setIsExploreOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isNetworkActive ? "bg-primary-50 text-primary-900" : "text-slate-700 hover:bg-slate-50"}`}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Network size={17} /></span>
                  <span className="text-sm font-semibold">My network<span className="mt-0.5 block text-xs font-normal text-slate-500">Connect with professionals</span></span>
                </Link>
                <Link href="/jobs" role="menuitem" aria-current={isJobsActive ? "page" : undefined} onClick={() => setIsExploreOpen(false)} className={`mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${isJobsActive ? "bg-primary-50 text-primary-900" : "text-slate-700 hover:bg-slate-50"}`}>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BriefcaseBusiness size={17} /></span>
                  <span className="text-sm font-semibold">Find jobs<span className="mt-0.5 block text-xs font-normal text-slate-500">Explore your next opportunity</span></span>
                </Link>
              </div>
            )}
          </div>
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

        <div className="relative ml-1" ref={accountRef}>
          <button
            type="button"
            aria-label="Open account menu"
            aria-expanded={isAccountMenuOpen}
            aria-haspopup="menu"
            aria-controls="account-menu"
            onClick={() => setIsAccountMenuOpen((open) => !open)}
            className={`group flex h-11 items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2 text-left shadow-sm transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 sm:gap-2.5 sm:pl-1.5 sm:pr-3 ${isAccountMenuOpen ? "border-primary-200 shadow-md shadow-primary-900/10" : "border-slate-200 hover:border-primary-200 hover:shadow-md hover:shadow-slate-900/5"}`}
          >
            <AccountAvatar src={user?.avatar} initials={initials} />
            <span className="hidden max-w-28 md:block">
              <span className="block truncate text-xs font-semibold leading-4 text-slate-800">{user?.firstName ?? "Account"}</span>
              <span className="block text-[10px] leading-3 text-slate-500">{roleLabel}</span>
            </span>
            <ChevronDown size={15} className={`hidden text-slate-400 transition duration-200 sm:block ${isAccountMenuOpen ? "rotate-180 text-primary-700" : "group-hover:text-slate-600"}`} />
          </button>

          {isAccountMenuOpen && (
            <div id="account-menu" role="menu" aria-label="Account" className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(19rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-900/15 ring-1 ring-black/2">
              <div className="relative overflow-hidden rounded-[1.25rem] bg-linear-to-br from-slate-50 via-white to-primary-50/80 p-4">
                <div aria-hidden="true" className="absolute -right-7 -top-10 h-28 w-28 rounded-full bg-primary-100/50 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <AccountAvatar src={user?.avatar} initials={initials} size="large" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-primary-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/profile" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="group mt-2 flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-primary-50/80 hover:text-primary-900 focus-visible:outline-2 focus-visible:outline-primary-700">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-primary-800"><UserRound size={17} /></span>
                <span className="flex-1">View profile<span className="mt-0.5 block text-xs font-normal text-slate-500">Manage your professional profile</span></span>
                <ChevronDown size={15} className="-rotate-90 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary-700" />
              </Link>
              <div className="mx-2 my-1 border-t border-slate-100" />
              <button type="button" role="menuitem" disabled={isLoggingOut} onClick={() => void signOut()} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-60">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-white group-hover:text-rose-600">{isLoggingOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} />}</span>
                <span>{isLoggingOut ? "Signing out…" : "Sign out"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
