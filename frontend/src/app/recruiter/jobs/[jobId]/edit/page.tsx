"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import JobForm from "@/components/jobs/JobForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import { getJobErrorMessage } from "@/components/jobs/jobErrors";
import {
  useGetJobByIdQuery,
  useUpdateJobMutation,
} from "@/redux/features/jobs/jobsApi";
import { useAppSelector } from "@/redux/hooks";
import type { JobPayload } from "@/types/job.types";
import JobCompanyAttribution from "@/components/jobs/JobCompanyAttribution";

export default function EditJobPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const { currentData, isLoading, isError, refetch } = useGetJobByIdQuery(
    jobId,
    { skip: user?.role !== "recruiter" }
  );
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const job = currentData?.data;

  const handleSubmit = async (payload: JobPayload) => {
    try {
      await updateJob({ jobId, data: payload }).unwrap();
      toast.success("Job updated and sent for review.");
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

            {isLoading && (
              <div role="status" className="flex min-h-64 items-center justify-center rounded-2xl bg-white text-sm text-slate-500">
                <LoaderCircle size={18} className="mr-2 animate-spin" />
                Loading your listing...
              </div>
            )}

            {isError && (
              <section role="alert" className="rounded-2xl border border-red-200 bg-white p-7 text-center">
                <h1 className="text-lg font-bold text-slate-900">Could not load this listing</h1>
                <p className="mt-2 text-sm text-slate-500">Check that the job exists and belongs to your account.</p>
                <button type="button" onClick={() => void refetch()} className="mt-4 font-semibold text-primary-800 hover:underline">
                  Try again
                </button>
              </section>
            )}

            {job && (
              <>
                <header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-white/10 p-3">
                      <BriefcaseBusiness size={22} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-primary-100">Update your listing</p>
                      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Edit job</h1>
                    </div>
                  </div>
                  {job.company && (
                    <div className="mt-5 rounded-2xl bg-white/10 p-4">
                      <p className="mb-2 text-xs font-medium text-primary-100">Company page</p>
                      <JobCompanyAttribution company={job.company} recruiter={job.postedBy} showRecruiter inverse />
                    </div>
                  )}
                  {job.moderationStatus === "approved" && (
                    <p className="mt-4 text-sm leading-6 text-primary-100">
                      Changes to an approved listing will send it back for admin review.
                    </p>
                  )}
                  {job.moderationNote && (
                    <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm leading-6 text-white">
                      Review note: {job.moderationNote}
                    </p>
                  )}
                </header>

                <JobForm
                  key={job._id}
                  initialJob={job}
                  isSubmitting={isUpdating}
                  submitLabel="Save and submit for review"
                  onSubmit={handleSubmit}
                />
              </>
            )}
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}
