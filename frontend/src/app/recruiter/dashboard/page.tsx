"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import {
  useGetRecruiterJobFunnelQuery,
  useGetRecruiterJobsOverviewQuery,
} from "@/redux/features/dashboard/dashboardApi";
import { useAppSelector } from "@/redux/hooks";
import type { RecruiterJobAnalytics } from "@/types/dashboard.types";

const funnelSteps = [
  { key: "applied", label: "Applications received", color: "bg-indigo-500" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-cyan-500" },
  { key: "hired", label: "Hired", color: "bg-emerald-500" },
  { key: "rejected", label: "Not moving forward", color: "bg-slate-300" },
] as const;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getJobStatus(job: RecruiterJobAnalytics) {
  if (job.moderationStatus === "pending") return "In review";
  if (job.moderationStatus === "rejected") return "Not approved";
  return job.status === "open" ? "Live" : "Closed";
}

function getStatusStyle(job: RecruiterJobAnalytics) {
  if (job.moderationStatus === "pending") return "bg-amber-50 text-amber-700";
  if (job.moderationStatus === "rejected") return "bg-rose-50 text-rose-700";
  return job.status === "open"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-600";
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof BriefcaseBusiness;
  tone: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_42px_-34px_rgba(15,23,42,0.34)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString()}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function JobsLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading recruiter analytics</span>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-36 animate-pulse rounded-[24px] bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="h-96 animate-pulse rounded-[28px] bg-white xl:col-span-7" />
        <div className="h-96 animate-pulse rounded-[28px] bg-white xl:col-span-5" />
      </div>
    </div>
  );
}

function RecruiterDashboardContent() {
  const user = useAppSelector((state) => state.auth.user);
  const [selectedJobId, setSelectedJobId] = useState("");
  const overviewQuery = useGetRecruiterJobsOverviewQuery(undefined, {
    skip: user?.role !== "recruiter",
    refetchOnMountOrArgChange: true,
  });
  const funnelQuery = useGetRecruiterJobFunnelQuery(selectedJobId, {
    skip: user?.role !== "recruiter" || !selectedJobId,
    refetchOnMountOrArgChange: true,
  });

  const overview = overviewQuery.data?.data;
  const jobs = overview?.jobs ?? [];
  const funnel = funnelQuery.currentData?.data;
  const selectedJob = jobs.find((job) => job._id === selectedJobId);
  const approvedOpenJobs = jobs.filter(
    (job) => job.status === "open" && job.moderationStatus === "approved"
  ).length;

  useEffect(() => {
    if (jobs.length === 0) {
      if (selectedJobId) setSelectedJobId("");
      return;
    }

    if (!jobs.some((job) => job._id === selectedJobId)) {
      setSelectedJobId(jobs[0]._id);
    }
  }, [jobs, selectedJobId]);

  const refetchAll = () => {
    overviewQuery.refetch();
    if (selectedJobId) funnelQuery.refetch();
  };

  if (user?.role !== "recruiter") {
    return <RoleNotice roleName="recruiter" />;
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc] pb-14">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-7 sm:pt-8 lg:px-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700">
            <ArrowLeft size={16} /> Personal dashboard
          </Link>
          <Link href="/recruiter/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-700">
            Manage job listings <ArrowUpRight size={15} />
          </Link>
        </div>

        {overviewQuery.isLoading ? (
          <JobsLoading />
        ) : (
          <>
            <section className="relative isolate overflow-hidden rounded-[30px] bg-[#111b3d] px-6 py-7 text-white shadow-[0_30px_75px_-44px_rgba(33,53,120,0.9)] sm:px-9 sm:py-9 lg:px-11">
              <div className="absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
              <div className="absolute -bottom-32 right-1/3 -z-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-semibold text-indigo-200">Recruiter workspace</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Job performance</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/80 sm:text-base">
                    See which roles are getting attention and how candidates are moving through your hiring funnel.
                  </p>
                </div>
                <Link href="/recruiter/jobs/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#17224a] shadow-sm transition hover:bg-indigo-50">
                  <Plus size={17} /> Post a job
                </Link>
              </div>
            </section>

            {overviewQuery.isError && (
              <div role="alert" className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center">
                <p>We couldn’t load your recruiter analytics.</p>
                <button type="button" onClick={refetchAll} className="inline-flex items-center gap-2 font-bold hover:text-rose-950">
                  <RefreshCw size={15} /> Try again
                </button>
              </div>
            )}

            {overview && (
              <>
                <section aria-label="Recruiter analytics summary" className="mt-6 grid gap-4 sm:grid-cols-3">
                  <SummaryCard label="Your job listings" value={overview.totals.jobs} detail={`${approvedOpenJobs} live and accepting applications`} icon={BriefcaseBusiness} tone="bg-indigo-50 text-indigo-600" />
                  <SummaryCard label="Listing views" value={overview.totals.views} detail="Views across all your job details" icon={Eye} tone="bg-cyan-50 text-cyan-600" />
                  <SummaryCard label="Applicants" value={overview.totals.applicants} detail="Candidates across all application stages" icon={UsersRound} tone="bg-emerald-50 text-emerald-600" />
                </section>

                {jobs.length === 0 ? (
                  <section className="mt-5 flex min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white px-6 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><BriefcaseBusiness size={24} /></span>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">Your hiring story starts with a role</h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Post your first job to see views, applicants, and hiring progress together.</p>
                    <Link href="/recruiter/jobs/new" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"><Plus size={16} /> Create a job listing</Link>
                  </section>
                ) : (
                  <section className="mt-5 grid items-start gap-5 xl:grid-cols-12">
                    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] xl:col-span-7">
                      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Your portfolio</p>
                          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Job listings</h2>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">Select a role to inspect its funnel</span>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {jobs.map((job) => (
                          <li key={job._id} className={`grid gap-3 px-5 py-4 transition sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-7 ${selectedJobId === job._id ? "bg-indigo-50/70" : "hover:bg-slate-50"}`}>
                            <button
                              type="button"
                              onClick={() => setSelectedJobId(job._id)}
                              aria-pressed={selectedJobId === job._id}
                              className="min-w-0 text-left"
                            >
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="truncate text-sm font-bold text-slate-900">{job.title}</span>
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(job)}`}>{getJobStatus(job)}</span>
                                </span>
                                <span className="mt-1 block text-xs text-slate-400">Created {formatDate(job.createdAt)}</span>
                              </span>
                            </button>
                            <span className="flex items-center gap-4 text-xs text-slate-500 sm:gap-5">
                              <span className="inline-flex items-center gap-1.5"><Eye size={14} className="text-slate-400" />{job.views.toLocaleString()}</span>
                              <span className="inline-flex items-center gap-1.5"><UsersRound size={14} className="text-slate-400" />{job.applicants.toLocaleString()}</span>
                            </span>
                              <Link
                                href={`/recruiter/jobs/${job._id}/applicants`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 transition hover:text-indigo-800 sm:justify-self-end"
                              >
                                Applicants <ArrowUpRight size={14} />
                              </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-slate-100 px-5 py-4 sm:px-7">
                        <Link href="/recruiter/jobs" className="text-sm font-bold text-indigo-600 transition hover:text-indigo-800">Manage all listings <ArrowRight size={15} className="inline-block" /></Link>
                      </div>
                    </div>

                    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-7 xl:col-span-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">Candidate journey</p>
                          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Application funnel</h2>
                        </div>
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><UsersRound size={18} /></span>
                      </div>
                      <label htmlFor="funnel-job" className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-400">Choose a job</label>
                      <select
                        id="funnel-job"
                        value={selectedJobId}
                        onChange={(event) => setSelectedJobId(event.target.value)}
                        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                      >
                        {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                      </select>

                      {selectedJob && (
                        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                          <span className="min-w-0 truncate text-sm font-bold text-slate-800">{selectedJob.title}</span>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">{selectedJob.views.toLocaleString()} views</span>
                        </div>
                      )}

                      {funnelQuery.isFetching && !funnelQuery.currentData && (
                        <div role="status" className="mt-8 flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                          <LoaderCircle size={17} className="animate-spin" /> Loading funnel
                        </div>
                      )}
                      {funnelQuery.isError && (
                        <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                          <p>We couldn’t load this job’s funnel.</p>
                          <button type="button" onClick={() => void funnelQuery.refetch()} className="mt-2 font-bold underline underline-offset-2">Try again</button>
                        </div>
                      )}
                      {funnel && (
                        <div className="mt-6">
                          <div className="flex items-end justify-between gap-3 border-b border-slate-100 pb-4">
                            <div>
                              <p className="text-3xl font-bold tracking-tight text-slate-950">{funnel.totalApplicants.toLocaleString()}</p>
                              <p className="mt-1 text-xs font-medium text-slate-500">Total applicants</p>
                            </div>
                            <Link href={`/recruiter/jobs/${selectedJobId}/applicants`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Review candidates</Link>
                          </div>
                          <div className="mt-5 space-y-5">
                            {funnelSteps.map(({ key, label, color }) => {
                              const count = funnel.byStatus[key];
                              const total = funnel.totalApplicants;
                              const width = total ? (count / total) * 100 : 0;
                              return (
                                <div key={key}>
                                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                    <span className="font-semibold text-slate-600">{label}</span>
                                    <span className="font-bold tabular-nums text-slate-900">{count.toLocaleString()}</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={count}>
                                    <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${width}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </section>
                  </section>
                )}
              </>
            )}

            {!overviewQuery.isLoading && !overviewQuery.isError && !overview && (
              <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                Recruiter analytics are unavailable right now. <button type="button" onClick={() => void overviewQuery.refetch()} className="font-bold underline underline-offset-2">Try again</button>
              </div>
            )}

            <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400">
              <p>Job views count visits to each job detail page. Applicant totals reflect current statuses.</p>
              <button type="button" onClick={refetchAll} disabled={overviewQuery.isFetching || funnelQuery.isFetching} className="inline-flex items-center gap-2 font-semibold text-slate-500 transition hover:text-indigo-600 disabled:opacity-50">
                <RefreshCw size={13} className={overviewQuery.isFetching || funnelQuery.isFetching ? "animate-spin" : ""} /> Refresh analytics
              </button>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}

export default function RecruiterDashboardPage() {
  return (
    <ProtectedRoute>
      <RecruiterDashboardContent />
    </ProtectedRoute>
  );
}
