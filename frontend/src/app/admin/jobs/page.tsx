"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AdminJobCard from "@/components/jobs/AdminJobCard";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import {
  useGetJobsQuery,
  useGetPendingJobsQuery,
  useRemoveJobByAdminMutation,
  useReviewJobMutation,
} from "@/redux/features/jobs/jobsApi";
import { useAppSelector } from "@/redux/hooks";
import type { Job, JobStatus } from "@/types/job.types";

const PAGE_SIZE = 10;
type AdminJobTab = "pending" | JobStatus;

const tabLabels: Record<AdminJobTab, string> = {
  pending: "Needs review",
  open: "Published · Open",
  closed: "Published · Closed",
};

export default function AdminJobsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<AdminJobTab>("pending");
  const [page, setPage] = useState(1);
  const [jobToRemove, setJobToRemove] = useState<Job | null>(null);

  const pendingQuery = useGetPendingJobsQuery(
    { page, limit: PAGE_SIZE },
    { skip: user?.role !== "admin" || activeTab !== "pending" }
  );
  const publishedQuery = useGetJobsQuery(
    {
      page,
      limit: PAGE_SIZE,
      status: activeTab === "closed" ? "closed" : "open",
    },
    { skip: user?.role !== "admin" || activeTab === "pending" }
  );
  const [reviewJob, { isLoading: isReviewing }] = useReviewJobMutation();
  const [removeJob, { isLoading: isRemoving }] = useRemoveJobByAdminMutation();

  const activeQuery = activeTab === "pending" ? pendingQuery : publishedQuery;
  const jobPage = activeQuery.currentData?.data;

  const changeTab = (tab: AdminJobTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleReview = async (
    job: Job,
    decision: "approve" | "reject",
    note: string
  ) => {
    try {
      await reviewJob({ jobId: job._id, decision, note }).unwrap();
      toast.success(decision === "approve" ? "Job listing approved." : "Changes requested from recruiter.");
      if (jobPage?.jobs.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  const confirmRemove = async () => {
    if (!jobToRemove) return;

    try {
      await removeJob(jobToRemove._id).unwrap();
      toast.success("Job listing and related applications removed.");
      if (jobPage?.jobs.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      setJobToRemove(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  const closeRemoveDialog = () => {
    if (!isRemoving) setJobToRemove(null);
  };

  return (
    <ProtectedRoute>
      {user?.role !== "admin" ? (
        <RoleNotice roleName="admin" />
      ) : (
        <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link href="/feed" className="text-sm font-medium text-slate-500 transition hover:text-primary-800">
                ← Back to feed
              </Link>
              <Link href="/jobs" className="text-sm font-medium text-slate-500 transition hover:text-primary-800">
                Browse public jobs
              </Link>
              <Link href="/admin/companies" className="text-sm font-medium text-slate-500 transition hover:text-primary-800">
                Company review
              </Link>
            </div>

            <header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <p className="text-sm font-medium text-primary-100">Platform administration</p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Job moderation</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">
                    Review new listings before they become public, and remove published jobs that violate guidelines.
                  </p>
                </div>
              </div>
            </header>

            <div role="tablist" aria-label="Job moderation views" className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {(Object.keys(tabLabels) as AdminJobTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => changeTab(tab)}
                  className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${activeTab === tab ? "bg-primary-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  {tabLabels[tab]}
                  {tab === "pending" && jobPage && activeTab === "pending" && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {jobPage.pagination.total}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {jobPage && (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{jobPage.pagination.total}</span>{" "}
                  {activeTab === "pending" ? "listings awaiting review" : `${activeTab} published listings`}
                </p>
                {activeQuery.isFetching && !activeQuery.isLoading && (
                  <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle size={14} className="animate-spin" />
                    Updating
                  </span>
                )}
              </div>
            )}

            {activeQuery.isLoading && (
              <div role="status" aria-busy="true" className="space-y-4">
                <span className="sr-only">Loading job moderation queue...</span>
                {[0, 1, 2].map((item) => (
                  <div key={item} aria-hidden="true" className="h-64 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            )}

            {activeQuery.isError && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>We couldn’t load these job listings.</p>
                <button type="button" onClick={() => void activeQuery.refetch()} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2">
                  <RefreshCw size={14} />
                  Try again
                </button>
              </div>
            )}

            {!activeQuery.isLoading && !activeQuery.isError && jobPage?.jobs.length === 0 && (
              <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-2xl bg-primary-50 p-4 text-primary-800">
                  <BriefcaseBusiness size={24} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  {activeTab === "pending" ? "The review queue is clear" : `No ${activeTab} listings`}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {activeTab === "pending"
                    ? "New recruiter listings will appear here for review."
                    : "There are no published jobs in this view right now."}
                </p>
              </section>
            )}

            {!activeQuery.isError && jobPage?.jobs.length ? (
              <div className="space-y-4">
                {jobPage.jobs.map((job) => (
                  <AdminJobCard
                    key={job._id}
                    job={job}
                    isPendingReview={activeTab === "pending"}
                    isReviewing={isReviewing}
                    onReview={(decision, note) => void handleReview(job, decision, note)}
                    onRemove={() => setJobToRemove(job)}
                  />
                ))}
              </div>
            ) : null}

            {jobPage && jobPage.pagination.totalPages > 1 && (
              <nav aria-label="Moderation queue pages" className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                  <span className="font-semibold text-slate-800">{jobPage.pagination.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || activeQuery.isFetching} aria-label="Previous moderation page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={18} />
                  </button>
                  <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= jobPage.pagination.totalPages || activeQuery.isFetching} aria-label="Next moderation page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </div>

          <ConfirmationDialog
            isOpen={Boolean(jobToRemove)}
            title="Remove this job listing?"
            description={`“${jobToRemove?.title}” and its applications will be permanently removed. The recruiter and applicants will receive a notification.`}
            confirmLabel="Remove listing"
            isDestructive
            isPending={isRemoving}
            onConfirm={confirmRemove}
            onCancel={closeRemoveDialog}
          />
        </main>
      )}
    </ProtectedRoute>
  );
}
