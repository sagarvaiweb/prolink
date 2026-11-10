"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Building2, ExternalLink, MapPin, Pencil, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobCard from "@/components/jobs/JobCard";
import { useFollowCompanyMutation, useGetCompanyByIdQuery, useGetCompanyJobsQuery, useUnfollowCompanyMutation } from "@/redux/features/companies/companiesApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setActiveCompany } from "@/redux/features/companies/companiesSlice";

export default function CompanyProfilePage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params.companyId;
  const activeCompanyId = useAppSelector((state) => state.companies.activeCompanyId);
  const dispatch = useAppDispatch();
  const profile = useGetCompanyByIdQuery(companyId);
  const jobs = useGetCompanyJobsQuery({ companyId, page: 1, limit: 10 });
  const [follow, followState] = useFollowCompanyMutation();
  const [unfollow, unfollowState] = useUnfollowCompanyMutation();
  const data = profile.currentData?.data;
  const company = data?.company;
  const canEdit = data?.viewerRole === "owner" || data?.viewerRole === "admin";
  const isMember = Boolean(data?.viewerRole);

  const toggleFollow = async () => {
    if (!company) return;
    try {
      if (data?.isFollowing) await unfollow(company._id).unwrap();
      else await follow(company._id).unwrap();
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Could not update your follow status.");
    }
  };

  return <ProtectedRoute><main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10"><div className="mx-auto max-w-5xl"><Link href="/companies" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-800"><ArrowLeft size={16} />All companies</Link>
    {profile.isLoading && <div className="h-72 animate-pulse rounded-3xl bg-white" />}
    {profile.isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">This company could not be loaded. It may have been removed or suspended.</div>}
    {company && <>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="h-32 bg-linear-to-r from-primary-950 via-primary-800 to-primary-600 sm:h-40" /><div className="px-5 pb-6 sm:px-8"><div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between"><div className="flex items-end gap-4">{company.logo ? <img src={company.logo} alt={`${company.name} logo`} className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm sm:h-24 sm:w-24" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-primary-50 text-primary-800 shadow-sm sm:h-24 sm:w-24"><Building2 size={34} /></div>}<div className="relative top-3 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{company.name}</h1>{company.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><BadgeCheck size={14} />Verified</span>}</div><p className="mt-1 text-sm text-slate-500">{company.industry || "Organization"}</p></div></div><div className="flex flex-wrap gap-2">{isMember && <button type="button" onClick={() => dispatch(setActiveCompany(company._id))} disabled={activeCompanyId === company._id} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-default disabled:bg-emerald-50 disabled:text-emerald-800">{activeCompanyId === company._id ? "Active company" : "Use for job posting"}</button>}{canEdit && <Link href={`/recruiter/companies/${company._id}/edit`} onClick={() => dispatch(setActiveCompany(company._id))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={15} />Edit profile</Link>}<button type="button" onClick={() => void toggleFollow()} disabled={followState.isLoading || unfollowState.isLoading} aria-pressed={data?.isFollowing} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${data?.isFollowing ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-primary-800 text-white hover:bg-primary-900"}`}>{followState.isLoading || unfollowState.isLoading ? "Updating…" : data?.isFollowing ? "Following" : "Follow company"}</button></div></div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{company.location || "Location not listed"}</span>{company.companySize && <span>{company.companySize} employees</span>}<span className="inline-flex items-center gap-1.5"><Users size={15} />{company.followerCount.toLocaleString()} followers</span>{company.website && <a href={company.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary-800 hover:underline">Website<ExternalLink size={13} /></a>}</div>
      </div></section>
      {canEdit && <div className="mt-3 flex justify-end"><Link href={"/recruiter/companies/" + company._id + "/team"} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-800"><UsersRound size={16} />Manage team</Link></div>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-900">About</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{company.description || "This company has not added a description yet."}</p></section><aside className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Company at a glance</h2><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-slate-400">Industry</dt><dd className="mt-1 font-medium text-slate-700">{company.industry || "Not specified"}</dd></div><div><dt className="text-slate-400">Company size</dt><dd className="mt-1 font-medium text-slate-700">{company.companySize ? `${company.companySize} employees` : "Not specified"}</dd></div><div><dt className="text-slate-400">Followers</dt><dd className="mt-1 font-medium text-slate-700">{company.followerCount.toLocaleString()}</dd></div></dl></aside></div>
      <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-sm font-semibold text-primary-700">Opportunities</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Open roles</h2></div>{jobs.currentData && <span className="text-sm text-slate-500">{jobs.currentData.data.pagination.total} roles</span>}</div>{jobs.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-white" />}{jobs.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Open roles couldn’t be loaded right now.</div>}{jobs.currentData?.data.jobs.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Building2 className="mx-auto text-slate-300" size={30} /><p className="mt-3 font-semibold text-slate-800">No open roles at the moment</p><p className="mt-1 text-sm text-slate-500">Follow this company to stay connected with its updates.</p></div>}<div className="space-y-4">{jobs.currentData?.data.jobs.map((job) => <JobCard key={job._id} job={job} />)}</div></section>
    </>}
  </div></main></ProtectedRoute>;
}
