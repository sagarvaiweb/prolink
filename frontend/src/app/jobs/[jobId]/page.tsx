"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import {
  useGetJobByIdQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
} from "@/redux/features/jobs/jobsApi";
import { useApplyToJobMutation } from "@/redux/features/jobs/applicationsApi";
import { useGetMyProfileQuery } from "@/redux/features/profile/profileApi";
import { useAppSelector } from "@/redux/hooks";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import type { ExperienceLevel, JobType } from "@/types/job.types";
import JobCompanyAttribution from "@/components/jobs/JobCompanyAttribution";

const experienceLabels: Record<ExperienceLevel, string> = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior level",
};

const jobTypeLabels: Record<JobType, string> = {
  "full-time": "Full time",
  "part-time": "Part time",
  internship: "Internship",
  contract: "Contract",
};

const getErrorMessage = (error: unknown) => {
  const response = error as { data?: { message?: string } };
  return response?.data?.message ?? "Could not update saved jobs. Please try again.";
};

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const { currentData, isLoading, isError, refetch } = useGetJobByIdQuery(jobId);
  const role = useAppSelector((state) => state.auth.user?.role);
  const { currentData: profileData } = useGetMyProfileQuery(undefined, { skip: role !== "student" && role !== "professional" });
  const [applyToJob, { isLoading: isApplying }] = useApplyToJobMutation();
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();
  const job = currentData?.data;
  const canSave = job?.moderationStatus === "approved";
  const profileHasResume = Boolean(profileData?.data.resumeUrl);
  const canApply = canSave && job?.status === "open" && (role === "student" || role === "professional");

  const handleApply = async () => {
    if (!job) return;
    try {
      await applyToJob(job._id).unwrap();
      toast.success("Application submitted successfully.");
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  const handleSave = async () => {
    if (!job) return;

    try {
      if (job.isSaved) {
        await unsaveJob(job._id).unwrap();
        toast.success("Job removed from saved jobs.");
      } else {
        await saveJob(job._id).unwrap();
        toast.success("Job saved for later.");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/jobs"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to jobs
          </Link>

          {isLoading && (
            <div role="status" aria-busy="true" className="space-y-4">
              <span className="sr-only">Loading job details...</span>
              <div className="h-52 animate-pulse rounded-3xl bg-primary-100" />
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
            </div>
          )}

          {isError && (
            <section role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <h1 className="text-xl font-bold text-slate-900">We couldn’t load this job</h1>
              <p className="mt-2 text-sm text-slate-500">
                The listing may have been removed or is temporarily unavailable.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Try again
                </button>
                <Link
                  href="/jobs"
                  className="rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900"
                >
                  Browse jobs
                </Link>
              </div>
            </section>
          )}

          {job && (
            <>
              {job.moderationStatus !== "approved" && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This listing is {job.moderationStatus} and is visible only to you.
                  {job.moderationNote && <p className="mt-1">Review note: {job.moderationNote}</p>}
                </div>
              )}

              <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-9">
                <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-white/10" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-3xl">
                    <div className="mb-4">
                      <JobCompanyAttribution company={job.company} recruiter={job.postedBy} showRecruiter inverse />
                    </div>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{job.title}</h1>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-primary-100">
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={16} />
                        {job.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness size={16} />
                        {jobTypeLabels[job.jobType]}
                      </span>
                      {job.isRemote && (
                        <span className="inline-flex items-center gap-2">
                          <Wifi size={16} />
                          Remote
                        </span>
                      )}
                    </div>
                  </div>
                  {canSave && (
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={isSaving || isUnsaving}
                      aria-pressed={job.isSaved}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
                    >
                      {job.isSaved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                      {job.isSaved ? "Saved" : "Save job"}
                    </button>
                  )}
                </div>
              </header>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">About the role</h2>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h2 className="text-lg font-bold text-slate-900">Skills for this role</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900">Role overview</h2>
                    <dl className="mt-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <BriefcaseBusiness size={17} className="mt-0.5 text-primary-700" />
                        <div>
                          <dt className="text-xs text-slate-500">Experience</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                            {experienceLabels[job.experienceLevel]}
                          </dd>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={17} className="mt-0.5 text-primary-700" />
                        <div>
                          <dt className="text-xs text-slate-500">Location</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.location}</dd>
                        </div>
                      </div>
                      {job.salaryRange && (
                        <div className="flex items-start gap-3">
                          <CheckCircle2 size={17} className="mt-0.5 text-primary-700" />
                          <div>
                            <dt className="text-xs text-slate-500">Salary range</dt>
                            <dd className="mt-0.5 text-sm font-semibold text-slate-800">{job.salaryRange}</dd>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <CalendarDays size={17} className="mt-0.5 text-primary-700" />
                        <div>
                          <dt className="text-xs text-slate-500">Posted</dt>
                          <dd className="mt-0.5 text-sm font-semibold text-slate-800">
                            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(job.createdAt))}
                          </dd>
                        </div>
                      </div>
                    </dl>
                  </section>

                  {job.status === "closed" && (
                    <p className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                      This position is currently closed.
                    </p>
                  )}
                  {canApply && (
                    <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5 shadow-sm">
                      <div className="flex items-center gap-2 font-bold text-slate-900"><FileText size={18} className="text-primary-700" /> Ready to apply?</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{profileHasResume ? "Your profile resume will be included with your application." : "Add a resume to your profile before applying to this role."}</p>
                      {profileHasResume ? (
                        <button type="button" onClick={() => void handleApply()} disabled={isApplying} className="mt-4 w-full rounded-xl bg-primary-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-wait disabled:opacity-60">
                          {isApplying ? "Submitting…" : "Apply for this job"}
                        </button>
                      ) : (
                        <Link href="/profile" className="mt-4 inline-flex w-full justify-center rounded-xl bg-primary-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-900">Add resume to profile</Link>
                      )}
                      <Link href="/applications" className="mt-3 inline-flex w-full justify-center text-sm font-semibold text-primary-800 hover:text-primary-950">View my applications</Link>
                    </section>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
