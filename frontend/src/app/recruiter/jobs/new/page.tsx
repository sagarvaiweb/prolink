"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobForm from "@/components/jobs/JobForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import { useCreateJobMutation } from "@/redux/features/jobs/jobsApi";
import { useGetCompanyByIdQuery } from "@/redux/features/companies/companiesApi";
import { useAppSelector } from "@/redux/hooks";
import type { JobPayload } from "@/types/job.types";

export default function NewJobPage() {
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector(
    (state) => state.companies.activeCompanyId
  );
  const router = useRouter();
  const [createJob, { isLoading }] = useCreateJobMutation();
  const { currentData: companyResponse, isLoading: isLoadingCompany } =
    useGetCompanyByIdQuery(activeCompanyId ?? "", {
      skip: !activeCompanyId,
    });

  const activeCompany = companyResponse?.data;
  const canPostForCompany = Boolean(
    activeCompanyId &&
      activeCompany?.viewerRole &&
      activeCompany.company.isVerified &&
      !activeCompany.company.isSuspended
  );

  const handleSubmit = async (payload: JobPayload) => {
    try {
      await createJob({
        ...payload,
        ...(canPostForCompany && activeCompanyId
          ? { companyId: activeCompanyId }
          : {}),
      }).unwrap();
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
                  <p className="text-sm font-medium text-primary-100">
                    Recruiter workspace
                  </p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Post a job
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-primary-100">
                Share a thoughtful role description. Your listing will be
                reviewed before it appears in job search.
              </p>
            </header>

            {activeCompanyId && isLoadingCompany ? (
              <div
                role="status"
                aria-label="Checking selected company"
                className="mb-4 h-16 animate-pulse rounded-2xl bg-white"
              />
            ) : canPostForCompany && activeCompany ? (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span className="pt-0.5 font-semibold">
                  Posting as {activeCompany.company.name}
                </span>
                <Link
                  href={`/companies/${activeCompany.company._id}`}
                  className="ml-auto font-semibold underline underline-offset-2"
                >
                  Change company
                </Link>
              </div>
            ) : (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                <span>
                  {activeCompanyId
                    ? "The selected company cannot post yet. This listing will use your recruiter profile."
                    : "Posting under your recruiter profile. Company branding is optional."}
                </span>
                <Link
                  href="/companies"
                  className="font-semibold text-primary-800 underline underline-offset-2"
                >
                  Choose a verified company
                </Link>
              </div>
            )}

            {!(activeCompanyId && isLoadingCompany) && (
              <JobForm
                isSubmitting={isLoading}
                submitLabel="Submit for review"
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}
