"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from "@/redux/features/notifications/notificationsApi";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import type { AppNotification } from "@/types/notification.types";

const PAGE_SIZE = 15;

function getDestination(notification: AppNotification) {
  if (notification.type === "job_application_received" && notification.relatedJobId) return `/recruiter/jobs/${notification.relatedJobId}/applicants`;
  if (notification.type === "application_status_updated") return "/applications";
  if (notification.relatedJobId) return `/jobs/${notification.relatedJobId}`;
  return null;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { currentData, isLoading, isFetching, isError, refetch } = useGetNotificationsQuery({ page, limit: PAGE_SIZE, unreadOnly });
  const [markRead, { isLoading: isMarking }] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const result = currentData?.data;
  const perform = async (action: () => Promise<unknown>, successMessage: string) => { try { await action(); toast.success(successMessage); } catch (error) { toast.error(getJobErrorMessage(error)); } };

  return <ProtectedRoute><main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10"><div className="mx-auto max-w-4xl">
    <Link href="/feed" className="text-sm font-medium text-slate-500 hover:text-primary-800">← Back to feed</Link>
    <header className="my-6 flex flex-col gap-4 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="text-sm text-primary-100">Stay up to date</p><h1 className="mt-1 text-3xl font-bold">Notifications</h1><p className="mt-2 text-sm text-primary-100">{result?.unreadCount ?? 0} unread</p></div><button type="button" disabled={!result?.unreadCount || isMarkingAll} onClick={() => void perform(() => markAll().unwrap(),"All notifications marked as read.")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-900 disabled:opacity-50">{isMarkingAll ? "Updating…" : "Mark all as read"}</button></header>
    <div className="mb-4 flex items-center justify-between"><button type="button" onClick={() => { setUnreadOnly((value)=>!value); setPage(1); }} aria-pressed={unreadOnly} className={`rounded-full px-4 py-2 text-sm font-semibold ${unreadOnly ? "bg-primary-800 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{unreadOnly ? "Unread only" : "All notifications"}</button>{isFetching && <LoaderCircle className="animate-spin text-slate-400" size={17}/>}</div>
    {isLoading && <div role="status" className="space-y-3">{[1,2,3].map((item)=><div key={item} className="h-24 animate-pulse rounded-2xl bg-white"/>)}</div>}
    {isError && <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">Could not load notifications. <button onClick={()=>void refetch()} className="font-semibold underline">Try again</button></div>}
    {!isLoading && !isError && result?.notifications.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><Bell className="mx-auto text-primary-700"/><h2 className="mt-3 font-bold text-slate-900">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">New application and job updates will appear here.</p></section>}
    <div className="space-y-2">{result?.notifications.map((notification)=>{ const destination=getDestination(notification); const content=<><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary-600"}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold text-slate-900">{notification.title}</h2><time className="text-xs text-slate-400">{new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(notification.createdAt))}</time></div><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>{destination && <span className="mt-2 inline-block text-sm font-semibold text-primary-800">View details →</span>}</div></>;
      return destination ? <Link key={notification._id} href={destination} onClick={()=>{if(!notification.isRead) void perform(()=>markRead(notification._id).unwrap(),"Notification marked as read.");}} className={`flex gap-3 rounded-2xl border p-5 transition hover:border-primary-200 hover:bg-primary-50/30 ${notification.isRead ? "border-slate-200 bg-white" : "border-primary-100 bg-white"}`}>{content}</Link> : <article key={notification._id} className={`flex gap-3 rounded-2xl border p-5 ${notification.isRead ? "border-slate-200 bg-white" : "border-primary-100 bg-white"}`}><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary-600"}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold text-slate-900">{notification.title}</h2><time className="text-xs text-slate-400">{new Intl.DateTimeFormat("en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(notification.createdAt))}</time></div><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p></div>{!notification.isRead && <button disabled={isMarking} onClick={()=>void perform(()=>markRead(notification._id).unwrap(),"Notification marked as read.")} className="shrink-0 self-center text-xs font-semibold text-primary-800">Mark read</button>}</article>;
    })}</div>
    {result && result.pagination.totalPages > 1 && <nav aria-label="Notification pages" className="mt-5 flex items-center justify-between rounded-xl bg-white p-4"><span className="text-sm text-slate-500">Page {page} of {result.pagination.totalPages}</span><div className="flex gap-2"><button onClick={()=>setPage((p)=>p-1)} disabled={page<=1||isFetching} aria-label="Previous page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><button onClick={()=>setPage((p)=>p+1)} disabled={page>=result.pagination.totalPages||isFetching} aria-label="Next page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></nav>}
  </div></main></ProtectedRoute>;
}
