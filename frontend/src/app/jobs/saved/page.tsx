"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobCard from "@/components/jobs/JobCard";
import { useGetSavedJobsQuery } from "@/redux/features/jobs/jobsApi";

const PAGE_SIZE = 10;

export default function SavedJobsPage() {
  const [page, setPage] = useState(1);
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetSavedJobsQuery({ page, limit: PAGE_SIZE });
  const savedPage = currentData?.data;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/jobs"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            ← Browse jobs
          </Link>

          <header className="mb-6 flex items-center gap-4 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-5 py-6 text-white shadow-lg shadow-primary-950/10 sm:px-8 sm:py-8">
            <div className="rounded-2xl bg-white/10 p-3">
              <BookmarkCheck size={25} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-100">
                Keep good opportunities close
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Saved jobs</h1>
              {savedPage && (
                <p className="mt-1 text-sm text-primary-100">
                  {savedPage.pagination.total} saved {savedPage.pagination.total === 1 ? "role" : "roles"}
                </p>
              )}
            </div>
          </header>

          {isLoading && (
            <div role="status" aria-busy="true" className="space-y-4">
              <span className="sr-only">Loading saved jobs...</span>
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  aria-hidden="true"
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="h-3 w-32 rounded bg-slate-100" />
                  <div className="mt-3 h-5 w-2/3 rounded bg-slate-100" />
                  <div className="mt-5 h-3 w-1/2 rounded bg-slate-100" />
                  <div className="mt-6 h-12 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p>We couldn’t load your saved jobs.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {isFetching && !isLoading && (
            <p role="status" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={15} className="animate-spin" />
              Updating saved jobs...
            </p>
          )}

          {!isLoading && !isError && savedPage?.jobs.length === 0 && (
            <section className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <div className="rounded-2xl bg-primary-50 p-4 text-primary-800">
                <BookmarkCheck size={24} />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Your shortlist starts here
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Save interesting roles as you browse and compare them when you’re ready.
              </p>
              <Link
                href="/jobs"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900"
              >
                <Search size={16} />
                Explore jobs
              </Link>
            </section>
          )}

          {!isError && savedPage?.jobs.length ? (
            <div className="space-y-4">
              {savedPage.jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onUnsave={() => {
                    if (savedPage.jobs.length === 1 && page > 1) {
                      setPage((current) => current - 1);
                    }
                  }}
                />
              ))}
            </div>
          ) : null}

          {savedPage && savedPage.pagination.totalPages > 1 && (
            <nav
              aria-label="Saved job pages"
              className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
            >
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                <span className="font-semibold text-slate-800">{savedPage.pagination.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1 || isFetching}
                  aria-label="Previous saved jobs page"
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= savedPage.pagination.totalPages || isFetching}
                  aria-label="Next saved jobs page"
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </nav>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
