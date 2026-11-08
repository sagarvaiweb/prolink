"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Eye,
  Heart,
  MessageSquareText,
  PenLine,
  RefreshCw,
  Sparkles,
  UsersRound,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ApplicationsStatusCard from "@/components/dashboard/ApplicationsStatusCard";
import EngagementChart from "@/components/dashboard/EngagementChart";
import NetworkGrowthCard from "@/components/dashboard/NetworkGrowthCard";
import { useAppSelector } from "@/redux/hooks";
import {
  useGetApplicationsSummaryQuery,
  useGetNetworkGrowthQuery,
  useGetPostEngagementQuery,
  useGetProfileViewsQuery,
} from "@/redux/features/dashboard/dashboardApi";
import type { DashboardRange } from "@/types/dashboard.types";

const ranges: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

const quickLinks = [
  {
    href: "/profile",
    title: "Polish your profile",
    description: "Make a stronger first impression",
    icon: PenLine,
    tone: "bg-indigo-50 text-indigo-600",
  },
  {
    href: "/feed",
    title: "Share an update",
    description: "Start a conversation with your network",
    icon: MessageSquareText,
    tone: "bg-teal-50 text-teal-600",
  },
  {
    href: "/jobs",
    title: "Explore opportunities",
    description: "Find a role that moves you forward",
    icon: BriefcaseBusiness,
    tone: "bg-amber-50 text-amber-600",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Eye;
  tone: string;
}) {
  return (
    <article className="group rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_42px_-34px_rgba(15,23,42,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-32px_rgba(15,23,42,0.32)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function DashboardLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading your dashboard</span>
      <div className="h-44 animate-pulse rounded-[30px] bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-[24px] bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-[28px] bg-white shadow-sm lg:col-span-8" />
        <div className="h-80 animate-pulse rounded-[28px] bg-white shadow-sm lg:col-span-4" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [range, setRange] = useState<DashboardRange>("30d");
  const profileViewsQuery = useGetProfileViewsQuery(range, { skip: !user });
  const engagementQuery = useGetPostEngagementQuery(range, { skip: !user });
  const networkQuery = useGetNetworkGrowthQuery(range, { skip: !user });
  const applicationsQuery = useGetApplicationsSummaryQuery(undefined, { skip: !user });

  const isLoading =
    profileViewsQuery.isLoading ||
    engagementQuery.isLoading ||
    networkQuery.isLoading ||
    applicationsQuery.isLoading;
  const isFetching =
    profileViewsQuery.isFetching ||
    engagementQuery.isFetching ||
    networkQuery.isFetching ||
    applicationsQuery.isFetching;
  const hasError =
    profileViewsQuery.isError ||
    engagementQuery.isError ||
    networkQuery.isError ||
    applicationsQuery.isError;

  const periodLabel = ranges.find((item) => item.value === range)?.label.toLowerCase() ?? "30 days";
  const greeting = getGreeting();
  const engagement = engagementQuery.data?.data;
  const network = networkQuery.data?.data;
  const profileViews = profileViewsQuery.data?.data;
  const applications = applicationsQuery.data?.data;
  const totalEngagement = engagement
    ? engagement.totals.likes + engagement.totals.comments + engagement.totals.shares
    : 0;

  const refetchAll = () => {
    profileViewsQuery.refetch();
    engagementQuery.refetch();
    networkQuery.refetch();
    applicationsQuery.refetch();
  };

  const currentDate = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f5f7fc] pb-14">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-7 sm:pt-8 lg:px-10">
          {isLoading ? (
            <DashboardLoading />
          ) : (
            <>
              <section className="relative isolate overflow-hidden rounded-[30px] bg-[#111b3d] px-6 py-7 text-white shadow-[0_30px_75px_-44px_rgba(33,53,120,0.9)] sm:px-9 sm:py-9 lg:px-11">
                <div className="absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
                <div className="absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
                <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
                  <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                      <Sparkles size={14} className="text-amber-300" />
                      Your professional pulse
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px]">
                      {greeting}{user?.firstName ? `, ${user.firstName}` : ""}.
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                      See how your presence is growing, what is resonating, and where to focus next.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href="/profile" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#17224a] transition hover:bg-indigo-50">
                        View my profile <ArrowUpRight size={16} />
                      </Link>
                      <Link href="/feed" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                        Go to feed <ArrowRight size={16} />
                      </Link>
                      {user?.role === "recruiter" && (
                        <Link href="/recruiter/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                          Recruiter analytics <BriefcaseBusiness size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 xl:items-end">
                    <p className="text-sm font-medium text-indigo-100/75">{currentDate}</p>
                    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-black/10 p-1.5" role="group" aria-label="Choose analytics date range">
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

              {hasError && (
                <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center">
                  <p>Some dashboard insights could not be loaded.</p>
                  <button type="button" onClick={refetchAll} className="inline-flex items-center gap-2 font-bold hover:text-rose-950">
                    <RefreshCw size={15} /> Try again
                  </button>
                </div>
              )}

              <section aria-label="Key metrics" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Profile views"
                  value={formatNumber(profileViews?.total ?? 0)}
                  detail={`${formatNumber(profileViews?.allTimeTotal ?? profileViews?.total ?? 0)} all-time profile visits`}
                  icon={Eye}
                  tone="bg-indigo-50 text-indigo-600"
                />
                <MetricCard
                  label="Post engagement"
                  value={formatNumber(totalEngagement)}
                  detail={`${formatNumber(engagement?.totals.posts ?? 0)} posts published in ${periodLabel}`}
                  icon={Heart}
                  tone="bg-rose-50 text-rose-500"
                />
                <MetricCard
                  label="Connections"
                  value={formatNumber(network?.totals.connections ?? 0)}
                  detail={`${formatNumber(network?.totals.followers ?? 0)} people follow your updates`}
                  icon={UsersRound}
                  tone="bg-teal-50 text-teal-600"
                />
                <MetricCard
                  label="Applications"
                  value={formatNumber(applications?.total ?? 0)}
                  detail={`${applications?.byStatus.shortlisted ?? 0} shortlisted · ${applications?.byStatus.hired ?? 0} offers`}
                  icon={BriefcaseBusiness}
                  tone="bg-amber-50 text-amber-600"
                />
              </section>

              <section className="mt-5 grid gap-5 lg:grid-cols-12">
                {engagement && (
                  <div className="lg:col-span-8">
                    <EngagementChart analytics={engagement} />
                  </div>
                )}
                {applications && (
                  <div className="lg:col-span-4">
                    <ApplicationsStatusCard summary={applications} />
                  </div>
                )}
              </section>

              <section className="mt-5 grid gap-5 lg:grid-cols-12">
                {network && (
                  <div className="lg:col-span-8">
                    <NetworkGrowthCard analytics={network} />
                  </div>
                )}
                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-7 lg:col-span-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">A little momentum</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Good next steps</h2>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Sparkles size={18} /></span>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {quickLinks.map(({ href, title, description, icon: Icon, tone }) => (
                      <Link key={href} href={href} className="group flex items-center gap-3 py-3.5 first:pt-2 last:pb-1">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-slate-800 transition group-hover:text-indigo-700">{title}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
                        </span>
                        <ArrowUpRight size={16} className="shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-600" />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <footer className="mt-7 flex flex-col justify-between gap-3 px-1 text-xs text-slate-400 sm:flex-row sm:items-center">
                <p>Insights are based on platform activity for the selected period.</p>
                <button type="button" onClick={refetchAll} disabled={isFetching} className="inline-flex items-center gap-2 self-start font-semibold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50 sm:self-auto">
                  <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
                  Refresh insights
                </button>
              </footer>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
