"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobCard from "@/components/jobs/JobCard";
import { useGetJobsQuery } from "@/redux/features/jobs/jobsApi";
import type {
  ExperienceLevel,
  JobListParams,
  JobType,
} from "@/types/job.types";

const PAGE_SIZE = 10;

const experienceOptions: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior level" },
];

const jobTypeOptions: { value: JobType; label: string }[] = [
  { value: "full-time", label: "Full time" },
  { value: "part-time", label: "Part time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const fieldClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";

function JobCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="h-3 w-32 rounded bg-slate-100" />
      <div className="mt-3 h-5 w-2/3 rounded bg-slate-100" />
      <div className="mt-5 h-3 w-1/2 rounded bg-slate-100" />
      <div className="mt-6 h-12 rounded bg-slate-100" />
      <div className="mt-5 flex gap-2">
        <div className="h-7 w-20 rounded-lg bg-slate-100" />
        <div className="h-7 w-24 rounded-lg bg-slate-100" />
        <div className="h-7 w-16 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JobListParams>({
    page: 1,
    limit: PAGE_SIZE,
  });
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const [jobTypeInput, setJobTypeInput] = useState("");
  const [remoteInput, setRemoteInput] = useState("");

  const query = useGetJobsQuery({ ...filters, page, limit: PAGE_SIZE });
  const result = query.currentData?.data;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters: JobListParams = { page: 1, limit: PAGE_SIZE };
    if (searchInput.trim()) nextFilters.search = searchInput.trim();
    if (locationInput.trim()) nextFilters.location = locationInput.trim();
    if (skillsInput.trim()) nextFilters.skills = skillsInput.trim();
    if (experienceInput) {
      nextFilters.experienceLevel = experienceInput as ExperienceLevel;
    }
    if (jobTypeInput) nextFilters.jobType = jobTypeInput as JobType;
    if (remoteInput) nextFilters.isRemote = remoteInput === "remote";
    setPage(1);
    setFilters(nextFilters);
  };

  const clearFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setSkillsInput("");
    setExperienceInput("");
    setJobTypeInput("");
    setRemoteInput("");
    setPage(1);
    setFilters({ page: 1, limit: PAGE_SIZE });
  };

  const hasFilters = Object.keys(filters).some(
    (key) => key !== "page" && key !== "limit"
  );

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/feed"
              className="text-sm font-medium text-slate-500 transition hover:text-primary-800"
            >
              ← Back to feed
            </Link>
            <Link
              href="/jobs/saved"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-800"
            >
              <BookmarkCheck size={17} />
              Saved jobs
            </Link>
            <Link
              href="/companies"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-800"
            >
              Explore companies
            </Link>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-6 py-8 text-white shadow-lg shadow-primary-950/10 sm:px-9 sm:py-10">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10"
            />
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary-100">
                Find your next opportunity
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Work that moves you forward.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-primary-100 sm:text-base">
                Explore roles from employers in your network and find a position
                that fits your skills and goals.
              </p>
              {result && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium text-white">
                  <BriefcaseBusiness size={16} />
                  {result.pagination.total} open {result.pagination.total === 1 ? "role" : "roles"}
                </p>
              )}
            </div>
          </section>

          <form
            onSubmit={handleSearch}
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <SlidersHorizontal size={17} className="text-primary-700" />
                Search and filter
              </h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-primary-800"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="relative sm:col-span-2 lg:col-span-2">
                <span className="sr-only">Search job title or keywords</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Job title or keywords"
                  className={`${fieldClassName} pl-10`}
                />
              </label>
              <label className="relative">
                <span className="sr-only">Location</span>
                <MapPin
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                  placeholder="Location"
                  className={`${fieldClassName} pl-10`}
                />
              </label>
              <label>
                <span className="sr-only">Experience level</span>
                <select
                  value={experienceInput}
                  onChange={(event) => setExperienceInput(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Any experience</option>
                  {experienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Job type</span>
                <select
                  value={jobTypeInput}
                  onChange={(event) => setJobTypeInput(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Any job type</option>
                  {jobTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Work location preference</span>
                <select
                  value={remoteInput}
                  onChange={(event) => setRemoteInput(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="">Remote or on-site</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                </select>
              </label>
              <label className="sm:col-span-2 lg:col-span-2">
                <span className="sr-only">Required skills</span>
                <input
                  value={skillsInput}
                  onChange={(event) => setSkillsInput(event.target.value)}
                  placeholder="Skills, separated by commas (e.g. React, Node.js)"
                  className={fieldClassName}
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 sm:col-span-2 lg:col-span-2"
              >
                <Search size={16} />
                Find jobs
              </button>
            </div>
          </form>

          <section className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Open positions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {result
                    ? `${result.pagination.total} matching ${result.pagination.total === 1 ? "position" : "positions"}`
                    : "Browse the latest opportunities"}
                </p>
              </div>
              {query.isFetching && !query.isLoading && (
                <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <LoaderCircle size={14} className="animate-spin" />
                  Updating results
                </span>
              )}
            </div>

            {query.isLoading && (
              <div role="status" aria-busy="true" className="space-y-4">
                <span className="sr-only">Loading job listings...</span>
                {[0, 1, 2].map((item) => <JobCardSkeleton key={item} />)}
              </div>
            )}

            {query.isError && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>We couldn’t load jobs right now.</p>
                <button
                  type="button"
                  onClick={() => void query.refetch()}
                  className="mt-2 font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}

            {!query.isLoading && !query.isError && result?.jobs.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-2xl bg-primary-50 p-4 text-primary-800">
                  <Search size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">No matching jobs yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Try a different keyword or broaden your filters to see more opportunities.
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {!query.isError && result?.jobs && result.jobs.length > 0 && (
              <div className="space-y-4">
                {result.jobs.map((job) => <JobCard key={job._id} job={job} />)}
              </div>
            )}

            {result && result.pagination.totalPages > 1 && (
              <nav
                aria-label="Job listing pages"
                className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
              >
                <p className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                  <span className="font-semibold text-slate-800">{result.pagination.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => current - 1)}
                    disabled={page <= 1 || query.isFetching}
                    aria-label="Previous jobs page"
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={page >= result.pagination.totalPages || query.isFetching}
                    aria-label="Next jobs page"
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
