"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, LoaderCircle, Search, ShieldCheck, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import {
  useAddCompanyMemberMutation,
  useGetCompanyByIdQuery,
  useGetCompanyMembersQuery,
  useRemoveCompanyMemberMutation,
  useSearchRecruiterCandidatesQuery,
} from "@/redux/features/companies/companiesApi";
import { useAppSelector } from "@/redux/hooks";
import type { CompanyMember } from "@/types/company.types";

const MEMBER_PAGE_SIZE = 20;
const CANDIDATE_PAGE_SIZE = 8;

function getErrorMessage(error: unknown, fallback: string) {
  const response = error as { data?: { message?: string } };
  return response?.data?.message ?? fallback;
}

function MemberAvatar({ member }: { member: CompanyMember }) {
  const { user } = member;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-sm font-bold text-primary-800">
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        (user.firstName[0] ?? "") + (user.lastName[0] ?? "")
      )}
    </div>
  );
}

export default function CompanyTeamPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const [memberPage, setMemberPage] = useState(1);
  const [candidatePage, setCandidatePage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [memberToRemove, setMemberToRemove] = useState<CompanyMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "recruiter">("recruiter");

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setCandidatePage(1);
  }, [search]);

  const companyQuery = useGetCompanyByIdQuery(companyId);
  const companyData = companyQuery.currentData?.data;
  const viewerRole = companyData?.viewerRole;
  const canManage = viewerRole === "owner" || viewerRole === "admin";
  const isOwner = viewerRole === "owner";
  const membersQuery = useGetCompanyMembersQuery(
    { companyId, page: memberPage, limit: MEMBER_PAGE_SIZE },
    { skip: !canManage }
  );
  const candidateQuery = useSearchRecruiterCandidatesQuery(
    { companyId, search, page: candidatePage, limit: CANDIDATE_PAGE_SIZE },
    { skip: !canManage || search.length < 2 }
  );
  const [addMember, addState] = useAddCompanyMemberMutation();
  const [removeMember, removeState] = useRemoveCompanyMemberMutation();
  const candidates = candidateQuery.currentData?.data.recruiters ?? [];
  const memberData = membersQuery.currentData?.data;

  useEffect(() => {
    if (!isOwner && selectedRole === "admin") setSelectedRole("recruiter");
  }, [isOwner, selectedRole]);

  const handleAdd = async (recruiterId: string) => {
    try {
      await addMember({ companyId, userId: recruiterId, role: selectedRole }).unwrap();
      toast.success("Recruiter added to the company team.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not add this recruiter. Please try again."));
    }
  };

  const handleRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember({ companyId, userId: memberToRemove.user._id }).unwrap();
      toast.success(memberToRemove.user.firstName + " removed from the team.");
      if (memberData?.members.length === 1 && memberPage > 1) {
        setMemberPage((page) => page - 1);
      }
      setMemberToRemove(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not remove this team member."));
    }
  };

  return (
    <ProtectedRoute>
      {user?.role !== "recruiter" ? (
        <RoleNotice roleName="recruiter" />
      ) : (
        <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <Link href={"/companies/" + companyId} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800">
              <ArrowLeft size={16} /> Company page
            </Link>
            {companyQuery.isLoading && <div role="status" className="h-44 animate-pulse rounded-3xl bg-white" />}
            {companyQuery.isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">We couldn’t load this company. It may have been removed or suspended.</div>}

            {companyData && (
              <>
                <header className="mb-6 flex flex-col gap-5 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="rounded-2xl bg-white/10 p-3"><UsersRound size={23} /></span>
                    <div>
                      <p className="text-sm font-medium text-primary-100">{companyData.company.name}</p>
                      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Manage your team</h1>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-primary-100">Add active recruiter accounts, choose their access level, and keep company access up to date.</p>
                    </div>
                  </div>
                  {memberData && <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3"><p className="text-2xl font-bold">{memberData.pagination.total}</p><p className="text-xs text-primary-100">Team members</p></div>}
                </header>

                {!canManage ? (
                  <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">Owners and company admins can manage the team. Your account does not have that access.</section>
                ) : (
                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div><h2 className="text-lg font-bold text-slate-900">Current team</h2><p className="mt-1 text-sm text-slate-500">People who can post roles for this company.</p></div>
                        <span className="rounded-xl bg-primary-50 p-2.5 text-primary-800"><UsersRound size={18} /></span>
                      </div>
                      {membersQuery.isLoading && <div role="status" className="space-y-3 py-5">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-50" />)}</div>}
                      {membersQuery.isError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">We couldn’t load the company team. Refresh the page and try again.</div>}
                      {memberData?.members.length === 0 && <p className="py-8 text-center text-sm text-slate-500">This company has no team members yet.</p>}
                      <ul className="divide-y divide-slate-100">
                        {memberData?.members.map((member) => (
                          <li key={member._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                            <MemberAvatar member={member} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-slate-900">{member.user.firstName} {member.user.lastName}{member.user._id === user?._id && <span className="ml-2 text-xs font-medium text-slate-400">You</span>}</p>
                              <p className="truncate text-sm text-slate-500">@{member.user.username}</p>
                            </div>
                            <div className="flex items-center gap-2 sm:justify-end">
                              <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize " + (member.role === "owner" ? "bg-violet-50 text-violet-800" : member.role === "admin" ? "bg-primary-50 text-primary-800" : "bg-slate-100 text-slate-700")}>
                                {member.role === "owner" ? <BadgeCheck size={13} /> : member.role === "admin" ? <ShieldCheck size={13} /> : null}{member.role}
                              </span>
                              {(member.role !== "owner" || (isOwner && companyData.company.ownerCount > 1)) && <button type="button" onClick={() => setMemberToRemove(member)} aria-label={"Remove " + member.user.firstName + " from company team"} className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"><UserMinus size={16} /></button>}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {memberData && memberData.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                          <span className="text-slate-500">Page {memberPage} of {memberData.pagination.totalPages}</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setMemberPage((page) => page - 1)} disabled={memberPage <= 1 || membersQuery.isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Previous</button>
                            <button type="button" onClick={() => setMemberPage((page) => page + 1)} disabled={memberPage >= memberData.pagination.totalPages || membersQuery.isFetching} className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 disabled:opacity-40">Next</button>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                      <div className="border-b border-slate-100 pb-4"><h2 className="text-lg font-bold text-slate-900">Add a recruiter</h2><p className="mt-1 text-sm leading-5 text-slate-500">Search by name or username. Only active recruiter accounts are listed.</p></div>
                      {isOwner && (
                        <label className="mt-4 block text-sm font-semibold text-slate-700">Access level
                          <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as "admin" | "recruiter")} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100">
                            <option value="recruiter">Recruiter — post and manage jobs</option><option value="admin">Admin — manage jobs and team</option>
                          </select>
                        </label>
                      )}
                      <label className="relative mt-4 block"><span className="sr-only">Find recruiter by name or username</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search recruiters…" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100" /></label>
                      {search.trim().length < 2 && <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">Enter at least 2 characters to find eligible recruiters.</p>}
                      {candidateQuery.isFetching && <div role="status" className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Searching recruiters</div>}
                      {candidateQuery.isError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Recruiter search is temporarily unavailable.</p>}
                      {!candidateQuery.isFetching && search.trim().length >= 2 && candidates.length === 0 && !candidateQuery.isError && <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-4 text-sm text-slate-500">No eligible recruiters found. Current team members are excluded.</p>}
                      <ul className="mt-3 space-y-2">
                        {candidates.map((candidate) => (
                          <li key={candidate._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-600">{candidate.avatar ? <img src={candidate.avatar} alt="" className="h-full w-full object-cover" /> : ((candidate.firstName[0] ?? "") + (candidate.lastName[0] ?? "")).toUpperCase()}</div>
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{candidate.firstName} {candidate.lastName}</p><p className="truncate text-xs text-slate-500">@{candidate.username}</p></div>
                            <button type="button" onClick={() => void handleAdd(candidate._id)} disabled={addState.isLoading} aria-label={"Add " + candidate.firstName + " to company team"} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-900 disabled:cursor-wait disabled:opacity-50"><UserPlus size={14} />Add</button>
                          </li>
                        ))}
                      </ul>
                      {candidateQuery.currentData && candidateQuery.currentData.data.pagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                          <span>{candidateQuery.currentData.data.pagination.total} eligible recruiters</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setCandidatePage((page) => page - 1)} disabled={candidatePage <= 1 || candidateQuery.isFetching} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 disabled:opacity-40">Previous</button>
                            <button type="button" onClick={() => setCandidatePage((page) => page + 1)} disabled={candidatePage >= candidateQuery.currentData.data.pagination.totalPages || candidateQuery.isFetching} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-700 disabled:opacity-40">Next</button>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </>
            )}
          </div>
          <ConfirmationDialog
            isOpen={Boolean(memberToRemove)}
            title="Remove this team member?"
            description={(memberToRemove?.user.firstName ?? "This recruiter") + " will lose access to manage jobs for " + (companyData?.company.name ?? "this company") + ". A company must keep at least one owner."}
            confirmLabel="Remove member"
            isDestructive
            isPending={removeState.isLoading}
            onConfirm={handleRemove}
            onCancel={() => { if (!removeState.isLoading) setMemberToRemove(null); }}
          />
        </main>
      )}
    </ProtectedRoute>
  );
}
