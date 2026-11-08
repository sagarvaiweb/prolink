"use client";

import { useState } from "react";
import {
  Check,
  BriefcaseBusiness,
  MapPin,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { Job } from "@/types/job.types";
import JobCompanyAttribution from "@/components/jobs/JobCompanyAttribution";

interface AdminJobCardProps {
  job: Job;
  isPendingReview?: boolean;
  isReviewing?: boolean;
  onReview?: (decision: "approve" | "reject", note: string) => void;
  onRemove: () => void;
}

export default function AdminJobCard({
  job,
  isPendingReview = false,
  isReviewing = false,
  onReview,
  onRemove,
}: AdminJobCardProps) {
  const [note, setNote] = useState("");
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPendingReview ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
              {isPendingReview ? "Awaiting review" : job.status === "open" ? "Published · Open" : "Published · Closed"}
            </span>
            <span className="text-xs text-slate-400">
              Submitted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(job.createdAt))}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900">{job.title}</h2>
          <div className="mt-3"><JobCompanyAttribution company={job.company} recruiter={job.postedBy} showRecruiter /></div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BriefcaseBusiness size={15} />
              {job.jobType.replace("-", " ")}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {job.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.requiredSkills.map((skill) => (
          <span key={skill} className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {skill}
          </span>
        ))}
      </div>

      {isPendingReview && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-slate-800" htmlFor={`review-note-${job._id}`}>
            Review note <span className="font-normal text-slate-500">(required when rejecting)</span>
          </label>
          <textarea
            id={`review-note-${job._id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Explain what the recruiter should change..."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
          />
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        {isPendingReview && (
          <>
            <button
              type="button"
              onClick={() => onReview?.("reject", note.trim())}
              disabled={isReviewing || !note.trim()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
              Request changes
            </button>
            <button
              type="button"
              onClick={() => onReview?.("approve", note.trim())}
              disabled={isReviewing}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} />
              Approve listing
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={isReviewing}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPendingReview ? <Trash2 size={16} /> : <ShieldCheck size={16} />}
          Remove listing
        </button>
      </div>
    </article>
  );
}
