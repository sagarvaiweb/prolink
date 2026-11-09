"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import RecruiterJobCard from "@/components/jobs/RecruiterJobCard";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import {
  useCloseJobMutation,
  useDeleteJobMutation,
  useGetMyJobsQuery,
} from "@/redux/features/jobs/jobsApi";
import { useAppSelector } from "@/redux/hooks";
import type { Job } from "@/types/job.types";

const PAGE_SIZE = 10;
type JobAction = "close" | "delete";

export default function RecruiterJobsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedAction, setSelectedAction] = useState<JobAction | null>(null);
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetMyJobsQuery({ page, limit: PAGE_SIZE }, { skip: user?.role !== "recruiter" });
  const [closeJob, { isLoading: isClosing }] = useCloseJobMutation();
  const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
  const jobPage = currentData?.data;

  const openConfirmation = (job: Job, action: JobAction) => {
    setSelectedJob(job);
    setSelectedAction(action);
  };

  const closeConfirmation = () => {
    if (isClosing || isDeleting) return;
    setSelectedJob(null);
    setSelectedAction(null);
  };

  const confirmAction = async () => {
    if (!selectedJob || !selectedAction) return;

    try {
      if (selectedAction === "close") {
        await closeJob(selectedJob._id).unwrap();
        toast.success("Job listing closed.");
      } else {
        await deleteJob(selectedJob._id).unwrap();
        toast.success("Job listing deleted.");
        if (jobPage?.jobs.length === 1 && page > 1) {
          setPage((current) => current - 1);
        }
      }
      setSelectedJob(null);
      setSelectedAction(null);
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      {user?.role !== "recruiter" ? (
        <RoleNotice roleName="recruiter" />
      ) : (
        <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/feed"
                className="text-sm font-medium text-slate-500 transition hover:text-primary-800"
              >
                ← Back to feed
              </Link>
              <Link
                href="/jobs"
                className="text-sm font-medium text-slate-500 transition hover:text-primary-800"
              >
                Browse jobs
              </Link>
              <Link
                href="/recruiter/dashboard"
                className="text-sm font-medium text-slate-500 transition hover:text-primary-800"
              >
                Analytics dashboard
              </Link>
            </div>

            <header className="mb-6 flex flex-col gap-5 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-white/10 p-3">
                  <BriefcaseBusiness size={24} />
                </span>
                <div>
                  <p className="text-sm font-medium text-primary-100">Recruiter workspace</p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your job listings</h1>
                  <p className="mt-2 text-sm text-primary-100">
                    Create a role, track its review status, and manage open positions.
                  </p>
                </div>
              </div>
              <Link
                href="/recruiter/jobs/new"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary-900 shadow-sm transition hover:bg-primary-50"
              >
                <Plus size={17} />
                Post a job
              </Link>
            </header>

            {jobPage && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{jobPage.pagination.total}</span>{" "}
                  {jobPage.pagination.total === 1 ? "listing" : "listings"} across all statuses
                </p>
                {isFetching && !isLoading && (
                  <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle size={14} className="animate-spin" />
                    Updating listings
                  </span>
                )}
              </div>
            )}

            {isLoading && (
              <div role="status" aria-busy="true" className="space-y-4">
                <span className="sr-only">Loading your job listings...</span>
                {[0, 1, 2].map((item) => (
                  <div key={item} aria-hidden="true" className="h-44 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            )}

            {isError && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>We couldn’t load your job listings.</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"
                >
                  <RefreshCw size={14} />
                  Try again
                </button>
              </div>
            )}

            {!isLoading && !isError && jobPage?.jobs.length === 0 && (
              <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-2xl bg-primary-50 p-4 text-primary-800">
                  <BriefcaseBusiness size={24} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">Your first role starts here</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Create a clear listing and it will appear here while it goes through admin review.
                </p>
                <Link
                  href="/recruiter/jobs/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900"
                >
                  <Plus size={16} />
                  Post a job
                </Link>
              </section>
            )}

            {!isError && jobPage?.jobs.length ? (
              <div className="space-y-4">
                {jobPage.jobs.map((job) => (
                  <RecruiterJobCard
                    key={job._id}
                    job={job}
                    onClose={() => openConfirmation(job, "close")}
                    onDelete={() => openConfirmation(job, "delete")}
                  />
                ))}
              </div>
            ) : null}

            {jobPage && jobPage.pagination.totalPages > 1 && (
              <nav aria-label="Your job listing pages" className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                  <span className="font-semibold text-slate-800">{jobPage.pagination.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || isFetching} aria-label="Previous listings page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={18} />
                  </button>
                  <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= jobPage.pagination.totalPages || isFetching} aria-label="Next listings page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </div>

          <ConfirmationDialog
            isOpen={Boolean(selectedJob && selectedAction)}
            title={selectedAction === "close" ? "Close this job listing?" : "Delete this job listing?"}
            description={
              selectedAction === "close"
                ? `“${selectedJob?.title}” will stop accepting applications and disappear from open job search.`
                : `“${selectedJob?.title}” and its saved entries and applications will be permanently removed.`
            }
            confirmLabel={selectedAction === "close" ? "Close listing" : "Delete listing"}
            isDestructive={selectedAction === "delete"}
            isPending={isClosing || isDeleting}
            onConfirm={confirmAction}
            onCancel={closeConfirmation}
          />
        </main>
      )}
    </ProtectedRoute>
  );
}
