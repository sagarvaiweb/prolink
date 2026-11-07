"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, ExternalLink, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import RoleNotice from "@/components/jobs/RoleNotice";
import { useAppSelector } from "@/redux/hooks";
import { useGetMyApplicationsQuery, useWithdrawApplicationMutation } from "@/redux/features/jobs/applicationsApi";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import type { Application } from "@/types/application.types";

const PAGE_SIZE = 10;
const statusStyles: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700", shortlisted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700", hired: "bg-violet-50 text-violet-700",
};

export default function ApplicationsPage() {
  const role = useAppSelector((state) => state.auth.user?.role);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Application | null>(null);
  const { currentData, isLoading, isFetching, isError, refetch } = useGetMyApplicationsQuery({ page, limit: PAGE_SIZE }, { skip: role !== "student" && role !== "professional" });
  const [withdraw, { isLoading: isWithdrawing }] = useWithdrawApplicationMutation();
  const result = currentData?.data;

  const confirmWithdraw = async () => {
    if (!selected) return;
    try {
      await withdraw(selected._id).unwrap();
      toast.success("Application withdrawn.");
      if (result?.applications.length === 1 && page > 1) setPage((current) => current - 1);
      setSelected(null);
    } catch (error) { toast.error(getJobErrorMessage(error)); }
  };

  return <ProtectedRoute>{role !== "student" && role !== "professional" ? <RoleNotice roleName="student or professional" /> : (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-10"><div className="mx-auto max-w-4xl">
      <Link href="/jobs" className="text-sm font-medium text-slate-500 hover:text-primary-800">← Browse jobs</Link>
      <header className="my-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white sm:p-8">
        <p className="text-sm text-primary-100">Candidate workspace</p><h1 className="mt-1 text-3xl font-bold">Your applications</h1>
        <p className="mt-2 text-sm text-primary-100">Follow each application and see updates from employers.</p>
      </header>
      {isLoading && <div role="status" className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-white" />)}</div>}
      {isError && <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6 text-sm text-red-700">Could not load applications. <button onClick={() => void refetch()} className="font-semibold underline">Try again</button></div>}
      {!isLoading && !isError && result?.applications.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><BriefcaseBusiness className="mx-auto text-primary-700"/><h2 className="mt-3 font-bold text-slate-900">No applications yet</h2><p className="mt-1 text-sm text-slate-500">Find a role that fits and apply to start tracking it here.</p><Link href="/jobs" className="mt-4 inline-flex rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white">Explore jobs</Link></section>}
      <div className="space-y-3">{result?.applications.map((application) => <article key={application._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div className="min-w-0"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[application.status]}`}>{application.status}</span><h2 className="mt-3 text-lg font-bold text-slate-900"><Link href={`/jobs/${application.job._id}`} className="hover:text-primary-800">{application.job.title}</Link></h2><p className="mt-1 text-sm text-slate-500">{application.job.location} · {application.job.jobType.replace("-", " ")} · Applied {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(application.createdAt))}</p></div>
          <div className="flex flex-wrap items-center gap-2">{typeof application.matchScore === "number" && <span className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800">{application.matchScore}% match</span>}<Link href={`/jobs/${application.job._id}`} aria-label={`View ${application.job.title}`} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ExternalLink size={17}/></Link>{application.status === "applied" && <button onClick={() => setSelected(application)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Withdraw</button>}</div>
        </div>{application.missingSkills?.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs font-semibold text-slate-500">Skills to build</p><div className="mt-2 flex flex-wrap gap-2">{application.missingSkills.map((skill) => <span key={skill} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{skill}</span>)}</div></div>}
      </article>)}</div>
      {result && result.pagination.totalPages > 1 && <nav aria-label="Application pages" className="mt-5 flex items-center justify-between rounded-xl bg-white p-4"><span className="text-sm text-slate-500">Page {page} of {result.pagination.totalPages}{isFetching && <LoaderCircle className="ml-2 inline animate-spin" size={14}/>}</span><div className="flex gap-2"><button onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || isFetching} aria-label="Previous page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><button onClick={() => setPage((p) => p + 1)} disabled={page >= result.pagination.totalPages || isFetching} aria-label="Next page" className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></nav>}
    </div><ConfirmationDialog isOpen={Boolean(selected)} title="Withdraw this application?" description={`Your application for “${selected?.job.title}” will be withdrawn.`} confirmLabel="Withdraw application" isDestructive isPending={isWithdrawing} onConfirm={confirmWithdraw} onCancel={() => !isWithdrawing && setSelected(null)}/></main>
  )}</ProtectedRoute>;
}
