"use client";

import { useState, type FormEvent } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { useGetAdminUsersQuery, useUpdateAdminUserRoleMutation, useUpdateAdminUserStatusMutation } from "@/redux/features/admin/adminApi";
import { useAppSelector } from "@/redux/hooks";
import type { AdminAccountStatus, AdminRole, AdminUser } from "@/types/admin.types";

const PAGE_SIZE = 20;
const roles: AdminRole[] = ["student", "professional", "recruiter", "admin"];
const statuses: AdminAccountStatus[] = ["active", "inactive", "suspended", "deleted"];
type PendingChange = { user: AdminUser; kind: "role"; value: AdminRole } | { user: AdminUser; kind: "status"; value: AdminAccountStatus };

const formatLabel = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusStyle: Record<AdminAccountStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
  suspended: "bg-amber-50 text-amber-800 ring-amber-600/15",
  deleted: "bg-red-50 text-red-700 ring-red-600/15",
};
const errorMessage = (error: unknown) => (error as { data?: { message?: string } })?.data?.message ?? "The account could not be updated. Try again.";

export default function AdminUsersPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState<AdminRole | "">("");
  const [statusInput, setStatusInput] = useState<AdminAccountStatus | "">("");
  const [filters, setFilters] = useState<{ search?: string; role?: AdminRole; status?: AdminAccountStatus }>({});
  const [page, setPage] = useState(1);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const query = useGetAdminUsersQuery({ page, limit: PAGE_SIZE, ...filters }, { skip: currentUser?.role !== "admin" });
  const [updateRole, roleState] = useUpdateAdminUserRoleMutation();
  const [updateStatus, statusState] = useUpdateAdminUserStatusMutation();
  const isSaving = roleState.isLoading || statusState.isLoading;
  const data = query.currentData?.data;

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({ ...(searchInput.trim() ? { search: searchInput.trim() } : {}), ...(roleInput ? { role: roleInput } : {}), ...(statusInput ? { status: statusInput } : {}) });
  };
  const clearFilters = () => { setSearchInput(""); setRoleInput(""); setStatusInput(""); setFilters({}); setPage(1); };

  const confirmChange = async () => {
    if (!pendingChange) return;
    try {
      if (pendingChange.kind === "role") await updateRole({ id: pendingChange.user._id, role: pendingChange.value }).unwrap();
      else await updateStatus({ id: pendingChange.user._id, accountStatus: pendingChange.value }).unwrap();
      toast.success(pendingChange.kind === "role" ? "Account role updated." : `Account ${pendingChange.value === "active" ? "reactivated" : `marked ${pendingChange.value}`} successfully.`);
      if (data?.users.length === 1 && page > 1 && pendingChange.kind === "status" && pendingChange.value !== (filters.status ?? "active")) setPage((value) => value - 1);
      setPendingChange(null);
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const closeDialog = () => { if (!isSaving) setPendingChange(null); };

  return (
    <ProtectedRoute>
      {currentUser?.role !== "admin" ? <RoleNotice roleName="admin" /> : (
        <main className="min-h-screen bg-[#f3f5f8] px-4 py-7 sm:px-6 lg:px-9 lg:py-9">
          <div className="mx-auto max-w-6xl">
            <header className="relative mb-6 overflow-hidden rounded-[28px] bg-[#10213a] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8">
              <div aria-hidden="true" className="absolute -right-10 -top-24 h-72 w-72 rounded-full border border-white/10" />
              <div aria-hidden="true" className="absolute right-20 top-12 h-32 w-32 rounded-full bg-teal-300/10 blur-3xl" />
              <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-100/10 px-3 py-1.5 text-xs font-semibold text-teal-100"><UsersRound size={14} /> Account directory</span>
                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">User accounts</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Search members, review account access, and apply careful role or status changes.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Matching accounts</p>
                  <p className="mt-1 text-2xl font-bold">{data?.pagination.total ?? "—"}</p>
                </div>
              </div>
            </header>

            <form onSubmit={applyFilters} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_190px_auto]">
                <label className="relative"><span className="sr-only">Search by name, username, or email</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, username, or email" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-50" /></label>
                <label><span className="sr-only">Filter by role</span><select value={roleInput} onChange={(event) => setRoleInput(event.target.value as AdminRole | "")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"><option value="">All roles</option>{roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}</select></label>
                <label><span className="sr-only">Filter by account status</span><select value={statusInput} onChange={(event) => setStatusInput(event.target.value as AdminAccountStatus | "")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></label>
                <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#10213a] px-5 text-sm font-bold text-white transition hover:bg-slate-800"><Search size={15} />Search</button>
              </div>
              {(filters.search || filters.role || filters.status) && <button type="button" onClick={clearFilters} className="mt-3 text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800">Clear filters</button>}
            </form>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div><h2 className="text-sm font-bold text-slate-900">Member directory</h2><p className="mt-1 text-xs text-slate-500">Account changes are recorded in the administrative activity log.</p></div>
                {query.isFetching && !query.isLoading && <span role="status" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500"><LoaderCircle size={14} className="animate-spin" />Updating</span>}
              </div>
              {query.isLoading ? <div role="status" aria-busy="true" className="space-y-3 p-5">{[0, 1, 2, 3].map((n) => <div key={n} className="h-[82px] animate-pulse rounded-xl bg-slate-100" />)}</div> : null}
              {query.isError && <div role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Could not load user accounts.<button type="button" onClick={() => void query.refetch()} className="ml-2 inline-flex items-center gap-1 font-bold underline"><RefreshCw size={13} />Try again</button></div>}
              {!query.isLoading && !query.isError && data?.users.length === 0 && <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500"><UsersRound size={22} /></span><h3 className="mt-4 font-bold text-slate-900">No matching accounts</h3><p className="mt-1 text-sm text-slate-500">Try a different search or clear the selected filters.</p></div>}
              {!!data?.users.length && <div className="divide-y divide-slate-100">
                {data.users.map((account) => {
                  const isSelf = account._id === currentUser?._id;
                  return <article key={account._id} className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(220px,1fr)_140px_160px] sm:items-center sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                      {account.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={account.avatar} alt="" className="h-11 w-11 rounded-full bg-slate-100 object-cover" />
                      ) : <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-50 font-bold text-teal-800">{account.firstName?.[0]}{account.lastName?.[0]}</span>}
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-slate-900">{account.firstName} {account.lastName}</p>{account.isEmailVerified && <span title="Email verified" className="text-teal-700"><BadgeCheck size={15} /></span>}{account.isVerified && <span title="Profile verified" className="text-blue-700"><ShieldCheck size={14} /></span>}</div><p className="truncate text-xs text-slate-500">@{account.username} <span className="px-1 text-slate-300">·</span>{account.email}</p><p className="mt-1 text-[11px] text-slate-400">Joined {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(account.createdAt))}</p></div>
                    </div>
                    <label className="flex items-center gap-2 sm:block"><span className="w-16 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:mb-1.5 sm:block">Role</span><select aria-label={`Change role for ${account.firstName} ${account.lastName}`} value={account.role} disabled={isSelf || isSaving} onChange={(event) => setPendingChange({ user: account, kind: "role", value: event.target.value as AdminRole })} className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:w-full">{roles.map((role) => <option key={role} value={role}>{formatLabel(role)}</option>)}</select></label>
                    <label className="flex items-center gap-2 sm:block"><span className="w-16 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:mb-1.5 sm:block">Status</span><span className="flex min-w-0 flex-1 items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${statusStyle[account.accountStatus]}`}>{formatLabel(account.accountStatus)}</span><select aria-label={`Change status for ${account.firstName} ${account.lastName}`} value={account.accountStatus} disabled={isSelf || isSaving} onChange={(event) => setPendingChange({ user: account, kind: "status", value: event.target.value as AdminAccountStatus })} className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">{statuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></span></label>
                    {isSelf && <span className="text-[10px] font-medium text-slate-400 sm:col-start-2 sm:col-span-2">Your own admin access is protected.</span>}
                  </article>;
                })}
              </div>}
              {data && data.pagination.totalPages > 1 && <nav aria-label="User account pages" className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-6"><p className="text-xs text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{data.pagination.totalPages}</strong></p><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => value - 1)} disabled={page <= 1 || query.isFetching} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={17} /></button><button type="button" onClick={() => setPage((value) => value + 1)} disabled={page >= data.pagination.totalPages || query.isFetching} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={17} /></button></div></nav>}
            </section>
          </div>
          <ConfirmationDialog isOpen={Boolean(pendingChange)} title={pendingChange?.kind === "role" ? "Change this account’s role?" : "Update this account’s status?"} description={pendingChange ? `${pendingChange.user.firstName} ${pendingChange.user.lastName} will be ${pendingChange.kind === "role" ? `assigned the ${formatLabel(pendingChange.value)} role` : `marked ${formatLabel(pendingChange.value)}`}. This change will be recorded in the activity log.` : ""} confirmLabel={pendingChange?.kind === "role" ? "Update role" : "Update status"} isDestructive={pendingChange?.kind === "status" && pendingChange.value !== "active"} isPending={isSaving} onConfirm={confirmChange} onCancel={closeDialog} />
        </main>
      )}
    </ProtectedRoute>
  );
}
