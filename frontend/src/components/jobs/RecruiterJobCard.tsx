import Link from "next/link";
import {
  BriefcaseBusiness,
  Edit3,
  MapPin,
  UsersRound,
  XCircle,
  Trash2,
} from "lucide-react";
import type { Job } from "@/types/job.types";

function StatusBadge({ job }: { job: Job }) {
  if (job.moderationStatus === "pending") {
    return <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Pending review</span>;
  }
  if (job.moderationStatus === "rejected") {
    return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">Needs changes</span>;
  }
  if (job.status === "closed") {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Closed</span>;
  }
  return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Live</span>;
}

export default function RecruiterJobCard({
  job,
  onClose,
  onDelete,
}: {
  job: Job;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge job={job} />
            <span className="text-xs text-slate-400">
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(job.createdAt))}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">{job.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness size={15} />
              {job.jobType.replace("-", " ")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={15} />
              {job.applicantCount} {job.applicantCount === 1 ? "applicant" : "applicants"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={`/recruiter/jobs/${job._id}/edit`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Edit3 size={15} />
            Edit
          </Link>
          {job.moderationStatus === "approved" && (
            <Link
              href={`/recruiter/jobs/${job._id}/applicants`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800 transition hover:bg-primary-100"
            >
              <UsersRound size={15} />
              Applicants
            </Link>
          )}
          {job.status === "open" && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <XCircle size={15} />
              Close
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {job.moderationNote && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Admin review note</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-700">{job.moderationNote}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span className="px-1 py-1 text-xs text-slate-400">+{job.requiredSkills.length - 4} more</span>
          )}
        </div>
        <Link
          href={`/jobs/${job._id}`}
          className="text-sm font-semibold text-primary-800 transition hover:text-primary-950"
        >
          Preview listing
        </Link>
      </div>
    </article>
  );
}
