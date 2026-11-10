"use client";

import { useState, type FormEvent } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import RoleNotice from "@/components/jobs/RoleNotice";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import AdminCompanyCard from "@/components/companies/AdminCompanyCard";
import {
  useGetPendingCompaniesQuery,
  useSearchCompaniesQuery,
  useSuspendCompanyMutation,
  useVerifyCompanyMutation,
} from "@/redux/features/companies/companiesApi";
import { useAppSelector } from "@/redux/hooks";
import type { Company, CompanyListParams, CompanySize } from "@/types/company.types";

const PAGE_SIZE = 10;
type ReviewTab = "pending" | "verified";
type ReviewAction = "verify" | "suspend";

const companySizes: CompanySize[] = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

function getErrorMessage(error: unknown) {
  const response = error as { data?: { message?: string } };
  return response?.data?.message ?? "The company could not be updated. Please try again.";
}

export default function AdminCompaniesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [sizeInput, setSizeInput] = useState<CompanySize | "">("");
  const [filters, setFilters] = useState<Omit<CompanyListParams, "page" | "limit" | "isVerified">>({});
  const [selectedAction, setSelectedAction] = useState<{ company: Company; action: ReviewAction } | null>(null);

  const pendingQuery = useGetPendingCompaniesQuery(
    { ...filters, page, limit: PAGE_SIZE },
    { skip: user?.role !== "admin" || tab !== "pending" }
  );
  const verifiedQuery = useSearchCompaniesQuery(
    { ...filters, isVerified: true, page, limit: PAGE_SIZE },
    { skip: user?.role !== "admin" || tab !== "verified" }
  );
  const [verifyCompany, verifyState] = useVerifyCompanyMutation();
  const [suspendCompany, suspendState] = useSuspendCompanyMutation();
  const isPending = verifyState.isLoading || suspendState.isLoading;
  const activeQuery = tab === "pending" ? pendingQuery : verifiedQuery;
  const companyPage = activeQuery.currentData?.data;

  const changeTab = (nextTab: ReviewTab) => {
    setTab(nextTab);
    setPage(1);
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setFilters({
      ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
      ...(industryInput.trim() ? { industry: industryInput.trim() } : {}),
      ...(sizeInput ? { companySize: sizeInput } : {}),
    });
  };

  const clearFilters = () => {
    setSearchInput("");
    setIndustryInput("");
    setSizeInput("");
    setFilters({});
    setPage(1);
  };

  const runAction = async () => {
    if (!selectedAction) return;
    const { company, action } = selectedAction;
    try {
      if (action === "verify") {
        await verifyCompany(company._id).unwrap();
        toast.success(company.name + " is verified and can now post jobs.");
      } else {
        const result = await suspendCompany(company._id).unwrap();
        const closedCount = result.data.closedJobCount ?? 0;
        toast.success(
          company.name + " was suspended. " + closedCount + " open " +
          (closedCount === 1 ? "job was" : "jobs were") + " closed."
        );
      }
      if (companyPage?.companies.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
      setSelectedAction(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const closeDialog = () => {
    if (!isPending) setSelectedAction(null);
  };

  const filtersApplied = Object.keys(filters).length > 0;

  return (
    <ProtectedRoute>
      {user?.role !== "admin" ? (
        <RoleNotice roleName="admin" />
      ) : (
        <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <header className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 p-6 text-white shadow-lg shadow-primary-950/10 sm:p-8">
              <div aria-hidden="true" className="absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/10" />
              <div className="relative flex items-start gap-4">
                <span className="rounded-2xl bg-white/10 p-3"><ShieldCheck size={24} /></span>
                <div>
                  <p className="text-sm font-medium text-primary-100">Platform administration</p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Company review</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100">Review company details before granting posting access, and suspend verified organizations when needed.</p>
                </div>
              </div>
            </header>

            <div role="tablist" aria-label="Company review views" className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {([
                ["pending", "Needs review"],
                ["verified", "Verified companies"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => changeTab(value)}
                  className={"min-h-10 rounded-xl px-4 text-sm font-semibold transition " + (tab === value ? "bg-primary-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}
                >
                  {label}
                  {tab === value && companyPage && <span className={"ml-2 rounded-full px-2 py-0.5 text-xs " + (tab === value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600")}>{companyPage.pagination.total}</span>}
                </button>
              ))}
            </div>

            <form onSubmit={applyFilters} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-800">Find a company</h2>
                {filtersApplied && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-slate-500 hover:text-primary-800">Clear filters</button>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="relative sm:col-span-2">
                  <span className="sr-only">Search company name, industry, or location</span>
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, industry, or location" className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100" />
                </label>
                <label><span className="sr-only">Filter by industry</span><input value={industryInput} onChange={(event) => setIndustryInput(event.target.value)} placeholder="Exact industry" className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100" /></label>
                <label><span className="sr-only">Filter by company size</span><select value={sizeInput} onChange={(event) => setSizeInput(event.target.value as CompanySize | "")} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"><option value="">Any company size</option>{companySizes.map((size) => <option key={size} value={size}>{size} employees</option>)}</select></label>
              </div>
              <div className="mt-3 flex justify-end"><button type="submit" className="rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-900">Apply filters</button></div>
            </form>

            {companyPage && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-600"><strong className="text-slate-900">{companyPage.pagination.total}</strong> {tab === "pending" ? "companies awaiting review" : "verified active companies"}</p>
                {activeQuery.isFetching && !activeQuery.isLoading && <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle size={14} className="animate-spin" />Updating list</span>}
              </div>
            )}

            {activeQuery.isLoading && <div role="status" aria-busy="true" className="space-y-4"><span className="sr-only">Loading companies for review</span>{[0, 1, 2].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-white" />)}</div>}
            {activeQuery.isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"><p>We couldn’t load this company list.</p><button type="button" onClick={() => void activeQuery.refetch()} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2"><RefreshCw size={14} />Try again</button></div>}
            {!activeQuery.isLoading && !activeQuery.isError && companyPage?.companies.length === 0 && (
              <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-2xl bg-primary-50 p-4 text-primary-800"><Building2 size={25} /></div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{tab === "pending" ? "The review queue is clear" : "No verified companies found"}</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{tab === "pending" ? "New company pages awaiting approval will appear here." : "Try adjusting the search or filters."}</p>
              </section>
            )}
            {!!companyPage?.companies.length && (
              <div className="space-y-4">
                {companyPage.companies.map((company) => (
                  <AdminCompanyCard
                    key={company._id}
                    company={company}
                    view={tab}
                    isBusy={isPending}
                    onVerify={() => setSelectedAction({ company, action: "verify" })}
                    onSuspend={() => setSelectedAction({ company, action: "suspend" })}
                  />
                ))}
              </div>
            )}

            {companyPage && companyPage.pagination.totalPages > 1 && (
              <nav aria-label="Company review pages" className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{companyPage.pagination.totalPages}</strong></p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || activeQuery.isFetching} aria-label="Previous page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
                  <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= companyPage.pagination.totalPages || activeQuery.isFetching} aria-label="Next page" className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
                </div>
              </nav>
            )}
          </div>

          <ConfirmationDialog
            isOpen={Boolean(selectedAction)}
            title={selectedAction?.action === "verify" ? "Verify this company?" : "Suspend this company?"}
            description={selectedAction?.action === "verify"
              ? selectedAction.company.name + " will receive verified status and its recruiters will be able to post jobs."
              : selectedAction?.company.name + " will be hidden from users, blocked from posting, and all currently open jobs will be closed."}
            confirmLabel={selectedAction?.action === "verify" ? "Verify company" : "Suspend company"}
            isDestructive={selectedAction?.action === "suspend"}
            isPending={isPending}
            onConfirm={runAction}
            onCancel={closeDialog}
          />
        </main>
      )}
    </ProtectedRoute>
  );
}
