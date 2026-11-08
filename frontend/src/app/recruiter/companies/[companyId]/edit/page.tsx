"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CompanyForm from "@/components/companies/CompanyForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import { useGetCompanyByIdQuery } from "@/redux/features/companies/companiesApi";
import { useAppSelector } from "@/redux/hooks";

export default function EditCompanyPage() {
  const params = useParams<{ companyId: string }>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { currentData, isLoading, isError } = useGetCompanyByIdQuery(params.companyId);
  const data = currentData?.data;
  const canEdit = data?.viewerRole === "owner" || data?.viewerRole === "admin";

  return <ProtectedRoute>{user?.role !== "recruiter" ? <RoleNotice roleName="recruiter" /> : <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10"><div className="mx-auto max-w-3xl"><Link href={`/companies/${params.companyId}`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-800"><ArrowLeft size={16} />Company page</Link><header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8"><span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-100"><Building2 size={17} />Recruiter workspace</span><h1 className="mt-2 text-3xl font-bold tracking-tight">Edit company profile</h1><p className="mt-2 text-sm leading-6 text-primary-100">Keep your organization details accurate and up to date.</p></header>{isLoading && <div role="status" className="h-80 animate-pulse rounded-2xl bg-white" />} {isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">We couldn’t load this company. It may have been removed or suspended.</div>}{data && !canEdit && <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Only company owners and admins can edit this profile.</div>}{data && canEdit && <CompanyForm company={data.company} onSuccess={(id) => router.push(`/companies/${id}`)} />}</div></main>}</ProtectedRoute>;
}
