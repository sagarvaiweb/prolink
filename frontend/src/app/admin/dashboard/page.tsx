"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import PlatformTrendChart from "@/components/dashboard/PlatformTrendChart";
import { useGetAdminPlatformStatsQuery } from "@/redux/features/dashboard/dashboardApi";
import { useAppSelector } from "@/redux/hooks";
import type { DashboardRange } from "@/types/dashboard.types";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  icon: typeof UsersRound;
  tone: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_14px_42px_-34px_rgba(15,23,42,0.34)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">{formatNumber(value)}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">{note}</p>
    </article>
  );
}

function AdminDashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading platform analytics</span>
      <div className="h-48 animate-pulse rounded-[30px] bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-3xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-107.5 animate-pulse rounded-3xl bg-white shadow-sm" />
    </div>
  );
}

function AdminDashboardContent() {
  const user = useAppSelector((state) => state.auth.user);
  const [range, setRange] = useState<DashboardRange>("30d");
  const statsQuery = useGetAdminPlatformStatsQuery(range, {
    skip: user?.role !== "admin",
    refetchOnMountOrArgChange: true,
  });
  const stats = statsQuery.data?.data;
  const newUsersInRange = stats?.series.reduce(
    (total, snapshot) => total + snapshot.newUsers,
    0
  ) ?? 0;

  if (user?.role !== "admin") {
    return <RoleNotice roleName="admin" />;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] pb-10 sm:pb-14">
      <div className="mx-auto w-full max-w-360 px-3 pt-4 sm:px-6 sm:pt-7 lg:px-9 lg:pt-8 2xl:px-12">
        {statsQuery.isLoading ? (
          <AdminDashboardLoading />
        ) : statsQuery.isError && !stats ? (
          <section role="alert" className="rounded-[28px] border border-rose-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600"><ShieldCheck size={22} /></div>
            <h1 className="mt-4 text-xl font-bold text-slate-900">Platform analytics are unavailable</h1>
            <p className="mt-2 text-sm text-slate-500">We couldn’t load the latest platform snapshot.</p>
            <button type="button" onClick={() => void statsQuery.refetch()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
              <RefreshCw size={15} /> Try again
            </button>
          </section>
        ) : stats ? (
          <>
            <section className="relative isolate overflow-hidden rounded-3xl bg-[#111b3d] px-5 py-6 text-white shadow-[0_30px_75px_-44px_rgba(33,53,120,0.9)] sm:rounded-[30px] sm:px-8 sm:py-8 lg:px-10 xl:px-11 xl:py-9">
              <div className="absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
              <div className="absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end xl:gap-10">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                    <ShieldCheck size={14} className="text-teal-300" /> Admin overview
                  </span>
                  <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px]">Platform pulse</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                    Track community growth and activity across the ProLink platform.
                  </p>
                </div>
                <div className="flex flex-col gap-4 xl:items-end">
                  <p className="text-sm font-medium text-indigo-100/75">
                    {statsQuery.isFetching ? (
                      <span className="inline-flex items-center gap-2"><LoaderCircle size={14} className="animate-spin" /> Updating snapshot</span>
                    ) : "Latest platform snapshot"}
                  </p>
                  <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-black/10 p-1.5 sm:flex sm:w-auto sm:flex-wrap" role="group" aria-label="Choose platform analytics date range">
                    {ranges.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setRange(item.value)}
                        aria-pressed={range === item.value}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition sm:px-3.5 ${range === item.value ? "bg-white text-[#18234b] shadow-sm" : "text-indigo-100/80 hover:bg-white/10 hover:text-white"}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {statsQuery.isError && (
              <div role="alert" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Showing the last available snapshot. The latest update failed.
              </div>
            )}

            <section aria-label="Current platform totals" className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
              <SummaryCard label="Total users" value={stats.totals.users} note={`+${formatNumber(newUsersInRange)} new in this period`} icon={UsersRound} tone="bg-indigo-50 text-indigo-600" />
              <SummaryCard label="Active today" value={stats.totals.activeUsersToday} note="Accounts with a login today" icon={ShieldCheck} tone="bg-teal-50 text-teal-600" />
              <SummaryCard label="Published posts" value={stats.totals.posts} note="Posts currently on the platform" icon={FileText} tone="bg-amber-50 text-amber-600" />
              <SummaryCard label="Job listings" value={stats.totals.jobs} note="Listings currently on the platform" icon={BriefcaseBusiness} tone="bg-rose-50 text-rose-500" />
            </section>

            <section className="mt-4 sm:mt-5">
              <PlatformTrendChart stats={stats} />
            </section>

            <footer className="mt-6 flex flex-col justify-between gap-3 px-1 text-xs text-slate-400 sm:flex-row sm:items-center">
              <p>Platform trends are built from daily UTC snapshots.</p>
              <button type="button" onClick={() => void statsQuery.refetch()} disabled={statsQuery.isFetching} className="inline-flex items-center gap-2 self-start font-semibold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50 sm:self-auto">
                <RefreshCw size={13} className={statsQuery.isFetching ? "animate-spin" : ""} /> Refresh snapshot
              </button>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
