"use client";

import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  ArrowRight,
  MapPin,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import JobCompanyAttribution from "@/components/jobs/JobCompanyAttribution";
import {
  useSaveJobMutation,
  useUnsaveJobMutation,
} from "@/redux/features/jobs/jobsApi";
import type { Job } from "@/types/job.types";

const experienceLabels = {
  entry: "Entry level",
  mid: "Mid level",
  senior: "Senior level",
};

const jobTypeLabels = {
  "full-time": "Full time",
  "part-time": "Part time",
  internship: "Internship",
  contract: "Contract",
};

const getErrorMessage = (error: unknown) => {
  const response = error as { data?: { message?: string } };
  return response?.data?.message ?? "Could not update saved jobs. Please try again.";
};

interface JobCardProps {
  job: Job;
  compact?: boolean;
  onUnsave?: () => void;
}

export default function JobCard({
  job,
  compact = false,
  onUnsave,
}: JobCardProps) {
  const [saveJob, { isLoading: isSaving }] = useSaveJobMutation();
  const [unsaveJob, { isLoading: isUnsaving }] = useUnsaveJobMutation();
  const isUpdatingSavedState = isSaving || isUnsaving;
  const handleSave = async () => {
    try {
      if (job.isSaved) {
        await unsaveJob(job._id).unwrap();
        onUnsave?.();
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
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <JobCompanyAttribution company={job.company} recruiter={job.postedBy} />
          <Link
            href={`/jobs/${job._id}`}
            className="mt-1 inline-block text-lg font-bold text-slate-900 transition group-hover:text-primary-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:text-xl"
          >
            {job.title}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isUpdatingSavedState}
          aria-label={job.isSaved ? "Remove saved job" : "Save job"}
          aria-pressed={job.isSaved}
          title={job.isSaved ? "Remove saved job" : "Save job"}
          className="shrink-0 rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-50"
        >
          {job.isSaved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={15} className="text-slate-400" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BriefcaseBusiness size={15} className="text-slate-400" />
          {jobTypeLabels[job.jobType]}
        </span>
        {job.isRemote && (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Wifi size={15} />
            Remote
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
          {experienceLabels[job.experienceLevel]}
        </span>
        {job.salaryRange && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {job.salaryRange}
          </span>
        )}
      </div>

      {!compact && (
        <>
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
            {job.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.requiredSkills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 5 && (
              <span className="px-1 py-1 text-xs font-medium text-slate-400">
                +{job.requiredSkills.length - 5} more
              </span>
            )}
          </div>
        </>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          Posted{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
            new Date(job.createdAt)
          )}
        </p>
        <Link
          href={`/jobs/${job._id}`}
          className="text-sm font-semibold text-primary-800 transition hover:text-primary-950"
        >
          <span className="inline-flex items-center gap-1.5">
            View details <ArrowRight size={15} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}
