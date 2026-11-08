"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobForm from "@/components/jobs/JobForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import { useCreateJobMutation } from "@/redux/features/jobs/jobsApi";
import { useAppSelector } from "@/redux/hooks";
import type { JobPayload } from "@/types/job.types";
import { useRouter } from "next/navigation";
import { useGetCompanyByIdQuery } from "@/redux/features/companies/companiesApi";

export default function NewJobPage() {
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector((state) => state.companies.activeCompanyId);
  const router = useRouter();
  const [createJob, { isLoading }] = useCreateJobMutation();
  const { currentData: companyResponse, isLoading: isLoadingCompany } = useGetCompanyByIdQuery(
    activeCompanyId ?? "",
    { skip: !activeCompanyId }
  );
  const activeCompany = companyResponse?.data;
  const canPostForCompany = Boolean(
    activeCompanyId && activeCompany?.viewerRole && activeCompany.company.isVerified && !activeCompany.company.isSuspended
  );

  const handleSubmit = async (payload: JobPayload) => {
    if (!activeCompanyId) return;
    try {
      await createJob({ ...payload, companyId: activeCompanyId }).unwrap();
      toast.success("Job submitted for admin review.");
      router.push("/recruiter/jobs");
    } catch (error) {
      toast.error(getJobErrorMessage(error));
    }
  };

  return (
    <ProtectedRoute>
      {user?.role !== "recruiter" ? (
        <RoleNotice roleName="recruiter" />
      ) : (
        <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/recruiter/jobs"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
            >
              <ArrowLeft size={16} />
              Your job listings
            </Link>

            <header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-white/10 p-3">
                  <BriefcaseBusiness size={22} />
                </span>
                <div>
                  <p className="text-sm font-medium text-primary-100">Recruiter workspace</p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Post a job</h1>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-100">
                Share a thoughtful role description. Your listing will be reviewed before it appears in job search.
              </p>
            </header>

            {!activeCompanyId ? (
              <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900">Choose a company first</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Job listings must belong to a verified company. Open a company page where you are a recruiter, then choose “Use for job posting.”</p>
                <Link href="/companies" className="mt-4 inline-flex rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900">Browse companies</Link>
              </section>
            ) : isLoadingCompany ? (
              <div role="status" className="h-28 animate-pulse rounded-2xl bg-white" />
            ) : !activeCompany?.viewerRole ? (
              <section role="alert" className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900">Company access needs attention</h2>
                <p className="mt-2 text-sm text-slate-600">You are no longer a recruiter for the selected company. Choose another company to continue.</p>
                <Link href="/companies" className="mt-4 inline-flex rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900">Choose a company</Link>
              </section>
            ) : !activeCompany.company.isVerified || activeCompany.company.isSuspended ? (
              <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="font-semibold text-amber-950">{activeCompany.company.isSuspended ? "This company is suspended" : "Company verification is pending"}</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">{activeCompany.company.name} cannot publish job listings until it is verified. You can update its profile or select a different verified company.</p>
                <div className="mt-4 flex flex-wrap gap-3"><Link href={`/companies/${activeCompany.company._id}`} className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-100">View company</Link><Link href="/companies" className="rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900">Choose another company</Link></div>
              </section>
            ) : canPostForCompany ? (
              <>
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span className="font-semibold">Posting as {activeCompany.company.name}</span><Link href={`/companies/${activeCompany.company._id}`} className="ml-auto font-semibold underline underline-offset-2">Change company</Link></div>
                <JobForm isSubmitting={isLoading} submitLabel="Submit for review" onSubmit={handleSubmit} />
              </>
            ) : null}
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}
