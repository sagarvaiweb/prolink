"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import { useAppSelector } from "@/redux/hooks";
import { useGetJobApplicantsQuery, useUpdateApplicationStatusMutation } from "@/redux/features/jobs/applicationsApi";
import { useGetJobByIdQuery } from "@/redux/features/jobs/jobsApi";
import JobCompanyAttribution from "@/components/jobs/JobCompanyAttribution";

const PAGE_SIZE = 10;

export default function JobApplicantsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const role = useAppSelector((state) => state.auth.user?.role);
  const [page, setPage] = useState(1);
  const { currentData, isLoading, isFetching, isError, refetch } = useGetJobApplicantsQuery({ jobId, page, limit: PAGE_SIZE }, { skip: role !== "recruiter" });
  const jobQuery = useGetJobByIdQuery(jobId, { skip: role !== "recruiter" });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
  const result = currentData?.data;

  const changeStatus = async (applicationId: string, status: "shortlisted" | "rejected" | "hired") => {
    try { await updateStatus({ applicationId, status, jobId }).unwrap(); toast.success(`Applicant ${status}.`); }
    catch (error) { toast.error(getJobErrorMessage(error)); }
  };

  return <ProtectedRoute>{role !== "recruiter" ? <RoleNotice roleName="recruiter"/> : <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10"><div className="mx-auto max-w-5xl">
    <Link href="/recruiter/jobs" className="text-sm font-medium text-slate-500 hover:text-primary-800">← Your job listings</Link>
    <header className="my-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white sm:p-8"><p className="text-sm text-primary-100">Recruiter workspace</p><h1 className="mt-1 text-3xl font-bold">Applicants</h1><p className="mt-2 text-sm text-primary-100">Review candidates, compare resume matches, and update application statuses.</p>{jobQuery.currentData?.data && <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><JobCompanyAttribution company={jobQuery.currentData.data.company} recruiter={jobQuery.currentData.data.postedBy} showRecruiter inverse/><div className="sm:text-right"><p className="text-xs text-primary-100">Applicants for</p><p className="mt-0.5 font-semibold">{jobQuery.currentData.data.title}</p></div></div>}</header>
    {isLoading && <div role="status" className="space-y-3">{[1,2,3].map((x)=><div key={x} className="h-40 animate-pulse rounded-2xl bg-white"/>)}</div>}
    {isError && <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">Could not load applicants. <button onClick={() => void refetch()} className="font-semibold underline">Try again</button></div>}
    {!isLoading && !isError && result?.applications.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><UsersRound className="mx-auto text-primary-700"/><h2 className="mt-3 font-bold text-slate-900">No applicants yet</h2><p className="mt-1 text-sm text-slate-500">Applications for this listing will appear here.</p></section>}
    <div className="space-y-3">{result?.applications.map((application) => { const candidate = application.applicant; const canShortlist = application.status === "applied"; const canReject = application.status === "applied" || application.status === "shortlisted"; const canHire = application.status === "shortlisted"; return <article key={application._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{candidate ? `${candidate.firstName} ${candidate.lastName}` : "Candidate"}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{application.status}</span>{typeof application.matchScore === "number" && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{application.matchScore}% match</span>}</div><p className="mt-1 text-sm text-slate-500">@{candidate?.username ?? "candidate"} · Applied {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(application.createdAt))}</p><div className="mt-3 flex flex-wrap gap-2"><a href={application.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View resume <ExternalLink size={14}/></a></div></div>
      <div className="flex flex-wrap gap-2">{canShortlist && <button disabled={isUpdating} onClick={() => void changeStatus(application._id,"shortlisted")} className="rounded-lg bg-primary-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Shortlist</button>}{canHire && <button disabled={isUpdating} onClick={() => void changeStatus(application._id,"hired")} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Hire</button>}{canReject && <button disabled={isUpdating} onClick={() => void changeStatus(application._id,"rejected")} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject</button>}{isUpdating && <LoaderCircle className="animate-spin self-center text-slate-400" size={17}/>}</div></div>
      {application.missingSkills?.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-semibold text-slate-500">Missing required skills</p><div className="mt-2 flex flex-wrap gap-2">{application.missingSkills.map((skill)=><span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{skill}</span>)}</div></div>}</article>; })}</div>
    {result && result.pagination.totalPages > 1 && <nav aria-label="Applicant pages" className="mt-5 flex items-center justify-between rounded-xl bg-white p-4"><span className="text-sm text-slate-500">Page {page} of {result.pagination.totalPages}{isFetching && <LoaderCircle className="ml-2 inline animate-spin" size={14}/>}</span><div className="flex gap-2"><button onClick={() => setPage((p)=>p-1)} disabled={page<=1||isFetching} aria-label="Previous page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><button onClick={() => setPage((p)=>p+1)} disabled={page>=result.pagination.totalPages||isFetching} aria-label="Next page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></nav>}
  </div></main>}</ProtectedRoute>;
}
