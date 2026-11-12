"use client";

import { useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Clock3, Filter, LoaderCircle, RefreshCw, ScrollText, ShieldCheck } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import { useGetAdminLogsQuery } from "@/redux/features/admin/adminApi";
import { useAppSelector } from "@/redux/hooks";
import type { AdminAction, AdminTargetType } from "@/types/admin.types";

const PAGE_SIZE = 20;
const actions: AdminAction[] = ["report_dismissed", "post_removed", "user_warned", "user_suspended", "company_verified", "company_rejected", "company_suspended", "user_reactivated", "user_role_changed", "user_verification_changed", "user_status_changed", "user_deleted", "job_removed", "other"];
const targetTypes: AdminTargetType[] = ["user", "company", "post", "job"];
const labels: Record<AdminAction, string> = {
  report_dismissed: "Report dismissed", post_removed: "Post removed", user_warned: "User warned", user_suspended: "User suspended",
  company_verified: "Company verified", company_rejected: "Company rejected", company_suspended: "Company suspended",
  user_reactivated: "User reactivated", user_role_changed: "User role changed", user_verification_changed: "User verification changed",
  user_status_changed: "User status changed", user_deleted: "User deleted", job_removed: "Job removed", other: "Other action",
};
const actionTone = (action: AdminAction) => action.includes("removed") || action.includes("suspended") || action.includes("deleted")
  ? "bg-rose-50 text-rose-700" : action.includes("verified") || action.includes("reactivated")
    ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700";

export default function AdminActivityPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [actionInput, setActionInput] = useState<AdminAction | "">("");
  const [targetInput, setTargetInput] = useState<AdminTargetType | "">("");
  const [filters, setFilters] = useState<{ action?: AdminAction; targetType?: AdminTargetType }>({});
  const [page, setPage] = useState(1);
  const query = useGetAdminLogsQuery({ page, limit: PAGE_SIZE, ...filters }, { skip: user?.role !== "admin" });
  const result = query.currentData?.data;

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...(actionInput ? { action: actionInput } : {}), ...(targetInput ? { targetType: targetInput } : {}) });
  };
  const clearFilters = () => { setActionInput(""); setTargetInput(""); setFilters({}); setPage(1); };

  return (
    <ProtectedRoute>
      {user?.role !== "admin" ? <RoleNotice roleName="admin" /> : (
        <main className="min-h-screen bg-[#f3f5f8] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
          <div className="mx-auto max-w-6xl">
            <header className="relative mb-6 overflow-hidden rounded-[28px] bg-[#10213a] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
              <div aria-hidden="true" className="absolute -right-12 -top-24 h-72 w-72 rounded-full border border-white/10" />
              <div aria-hidden="true" className="absolute right-24 top-12 h-36 w-36 rounded-full bg-lime-200/10 blur-3xl" />
              <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-lime-200/20 bg-lime-100/10 px-3 py-1.5 text-xs font-semibold text-lime-100"><ShieldCheck size={14} /> Governance trail</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Activity log</h1><p className="mt-2 text-sm leading-6 text-slate-300">A clear, searchable record of administrative changes across user accounts, posts, jobs, and companies.</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Matching actions</p><p className="mt-1 text-2xl font-bold">{result?.pagination.total ?? "—"}</p></div>
              </div>
            </header>

            <form onSubmit={applyFilters} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Filter size={14} /> Refine the activity</div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <label><span className="sr-only">Filter by action</span><select value={actionInput} onChange={(event) => setActionInput(event.target.value as AdminAction | "")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"><option value="">All actions</option>{actions.map((action) => <option key={action} value={action}>{labels[action]}</option>)}</select></label>
                <label><span className="sr-only">Filter by target type</span><select value={targetInput} onChange={(event) => setTargetInput(event.target.value as AdminTargetType | "")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"><option value="">All target types</option>{targetTypes.map((target) => <option key={target} value={target}>{target[0].toUpperCase() + target.slice(1)}</option>)}</select></label>
                <div className="flex gap-2"><button type="submit" className="h-11 flex-1 rounded-xl bg-[#10213a] px-5 text-sm font-bold text-white transition hover:bg-slate-800 sm:flex-none">Apply filters</button>{(filters.action || filters.targetType) && <button type="button" onClick={clearFilters} className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Clear</button>}</div>
              </div>
            </form>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="text-sm font-bold text-slate-900">Administrative actions</h2><p className="mt-1 text-xs text-slate-500">Newest actions appear first.</p></div>{query.isFetching && !query.isLoading && <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" />Updating</span>}</div>
              {query.isLoading && <div role="status" aria-busy="true" className="space-y-4 p-5">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>}
              {query.isError && <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Could not load the activity log.<button type="button" onClick={() => void query.refetch()} className="ml-2 inline-flex items-center gap-1 font-bold underline"><RefreshCw size={13} />Try again</button></div>}
              {!query.isLoading && !query.isError && result?.logs.length === 0 && <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><ScrollText size={22} /></span><h3 className="mt-4 font-bold text-slate-900">No activity found</h3><p className="mt-1 text-sm text-slate-500">Administrative changes matching these filters will appear here.</p></div>}
              {!!result?.logs.length && <div className="divide-y divide-slate-100">
                {result.logs.map((entry) => {
                  const admin = typeof entry.admin === "object" ? entry.admin : null;
                  const adminName = admin ? `${admin.firstName} ${admin.lastName}`.trim() || admin.username : "Administrator";
                  const date = new Date(entry.createdAt);
                  return <article key={entry._id} className="flex gap-3 px-5 py-4 sm:gap-4 sm:px-6">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><ScrollText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-900">{labels[entry.action]}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${actionTone(entry.action)}`}>{entry.targetType}</span></div>
                      <p className="mt-1 text-xs text-slate-500">By <span className="font-semibold text-slate-700">{adminName}</span> <span className="px-1 text-slate-300">·</span> Target <span className="font-mono text-[11px] text-slate-700">{entry.targetId}</span></p>
                      {entry.note && <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{entry.note}</p>}
                    </div>
                    <time dateTime={entry.createdAt} className="hidden shrink-0 items-start gap-1.5 pt-1 text-[11px] text-slate-400 md:flex"><Clock3 size={13} />{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)}</time>
                    <time dateTime={entry.createdAt} className="shrink-0 pt-1 text-[10px] text-slate-400 md:hidden">{new Intl.DateTimeFormat(undefined, { dateStyle: "short" }).format(date)}</time>
                  </article>;
                })}
              </div>}
              {result && result.pagination.totalPages > 1 && <nav aria-label="Activity log pages" className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6"><p className="text-xs text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{result.pagination.totalPages}</strong></p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || query.isFetching} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={17} /></button><button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= result.pagination.totalPages || query.isFetching} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={17} /></button></div></nav>}
            </section>
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}
