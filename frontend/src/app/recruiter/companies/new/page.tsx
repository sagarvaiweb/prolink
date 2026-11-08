"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CompanyForm from "@/components/companies/CompanyForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import { useAppSelector } from "@/redux/hooks";

export default function CreateCompanyPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  return <ProtectedRoute>{user?.role !== "recruiter" ? <RoleNotice roleName="recruiter" /> : <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10"><div className="mx-auto max-w-3xl"><Link href="/companies" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-800"><ArrowLeft size={16} />Companies</Link><header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8"><span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-100"><Building2 size={17} />Recruiter workspace</span><h1 className="mt-2 text-3xl font-bold tracking-tight">Create your company page</h1><p className="mt-2 max-w-xl text-sm leading-6 text-primary-100">Give candidates a clear picture of your organization. Your company page will be reviewed before it can publish jobs.</p></header><CompanyForm onSuccess={(id) => router.push(`/companies/${id}`)} /></div></main>}</ProtectedRoute>;
}
