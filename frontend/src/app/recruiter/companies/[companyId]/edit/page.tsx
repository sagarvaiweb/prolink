"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CompanyForm from "@/components/companies/CompanyForm";
import RoleNotice from "@/components/jobs/RoleNotice";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import {
  useDeleteCompanyMutation,
  useGetCompanyByIdQuery,
} from "@/redux/features/companies/companiesApi";
import { setActiveCompany } from "@/redux/features/companies/companiesSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function EditCompanyPage() {
  const params = useParams<{ companyId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activeCompanyId = useAppSelector(
    (state) => state.companies.activeCompanyId
  );
  const { currentData, isLoading, isError } = useGetCompanyByIdQuery(
    params.companyId
  );
  const [deleteCompany, deleteState] = useDeleteCompanyMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const data = currentData?.data;
  const isOwner = data?.viewerRole === "owner";
  const canEdit = isOwner || data?.viewerRole === "admin";

  const confirmDelete = async () => {
    try {
      await deleteCompany(params.companyId).unwrap();
      if (activeCompanyId === params.companyId) {
        dispatch(setActiveCompany(null));
      }
      toast.success("Company deleted.");
      router.replace("/companies");
    } catch (error) {
      const response = error as { data?: { message?: string } };
      toast.error(
        response.data?.message ?? "The company could not be deleted."
      );
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
              href={`/companies/${params.companyId}`}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-800"
            >
              <ArrowLeft size={16} /> Company page
            </Link>

            <header className="mb-6 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-100">
                <Building2 size={17} /> Recruiter workspace
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Edit company profile
              </h1>
              <p className="mt-2 text-sm leading-6 text-primary-100">
                Keep your organization details accurate and up to date.
              </p>
            </header>

            {isLoading && (
              <div role="status" className="h-80 animate-pulse rounded-2xl bg-white" />
            )}
            {isError && (
              <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                We couldn’t load this company. It may have been removed or suspended.
              </div>
            )}
            {data && !canEdit && (
              <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                Only company owners and admins can edit this profile.
              </div>
            )}
            {data && canEdit && (
              <>
                <CompanyForm
                  company={data.company}
                  onSuccess={(id) => router.push(`/companies/${id}`)}
                />
                {isOwner && (
                  <section className="mt-8 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-semibold text-slate-900">Delete company</h2>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                          Deletion is available only when the company has no job history and has a single owner.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} /> Delete company
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          <ConfirmationDialog
            isOpen={isDeleteDialogOpen}
            title="Delete this company?"
            description="This permanently removes the company page, its recruiter memberships, and its followers. Companies with job history cannot be deleted; ask an admin to suspend one instead."
            confirmLabel="Delete company"
            isDestructive
            isPending={deleteState.isLoading}
            onConfirm={confirmDelete}
            onCancel={() => setIsDeleteDialogOpen(false)}
          />
        </main>
      )}
    </ProtectedRoute>
  );
}
