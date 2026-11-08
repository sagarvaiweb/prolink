"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, ChevronLeft, ChevronRight, Plus, Search, Users } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import CompanyCard from "@/components/companies/CompanyCard";
import { useSearchCompaniesQuery } from "@/redux/features/companies/companiesApi";
import { useAppSelector } from "@/redux/hooks";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { currentData, isLoading, isFetching, isError, refetch } = useSearchCompaniesQuery({ page, limit: PAGE_SIZE, ...(search ? { search } : {}) });
  const result = currentData?.data;

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(input.trim());
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/feed" className="text-sm font-medium text-slate-500 hover:text-primary-800">← Back to feed</Link>{user?.role === "recruiter" && <Link href="/recruiter/companies/new" className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900"><Plus size={17} />Create company</Link>}</div>
          <header className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-6 py-8 text-white shadow-lg shadow-primary-950/10 sm:px-9 sm:py-10"><div aria-hidden="true" className="absolute -right-10 -top-16 h-60 w-60 rounded-full border border-white/10" /><div className="relative max-w-2xl"><span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-100"><Building2 size={17} />Organizations on ProLink</span><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Find the teams shaping your next move.</h1><p className="mt-3 text-sm leading-6 text-primary-100 sm:text-base">Explore organizations, learn what they do, and discover open opportunities from their teams.</p>{result && <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-sm font-medium"><Users size={16} />{result.pagination.total.toLocaleString()} organizations</span>}</div></header>
          <form onSubmit={submitSearch} className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search companies</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search by company, industry, or location" className="h-11 w-full rounded-xl border border-slate-200 px-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100" /></label><button type="submit" className="h-11 rounded-xl bg-primary-800 px-5 text-sm font-semibold text-white transition hover:bg-primary-900">Search companies</button></form>

          {isLoading && <div role="status" aria-busy="true" className="mt-6 grid gap-4 md:grid-cols-2"><span className="sr-only">Loading companies</span>{[0,1,2,3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-white" />)}</div>}
          {isError && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">We couldn’t load companies. <button onClick={() => void refetch()} className="font-semibold underline underline-offset-2">Try again</button></div>}
          {!isLoading && !isError && result?.companies.length === 0 && <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Building2 className="mx-auto text-slate-300" size={34} /><h2 className="mt-4 text-lg font-semibold text-slate-900">No organizations found</h2><p className="mt-1 text-sm text-slate-500">Try another name, industry, or location.</p></section>}
          {!!result?.companies.length && <><div className="mt-6 grid gap-4 md:grid-cols-2">{result.companies.map((company) => <CompanyCard key={company._id} company={company} />)}</div>{result.pagination.totalPages > 1 && <nav aria-label="Company pages" className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"><p className="text-sm text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{result.pagination.totalPages}</strong>{isFetching && <span className="ml-2">Updating…</span>}</p><div className="flex gap-2"><button type="button" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)} aria-label="Previous page" className="rounded-xl border border-slate-200 p-2 text-slate-700 disabled:opacity-40"><ChevronLeft size={18} /></button><button type="button" disabled={page >= result.pagination.totalPages || isFetching} onClick={() => setPage((value) => value + 1)} aria-label="Next page" className="rounded-xl border border-slate-200 p-2 text-slate-700 disabled:opacity-40"><ChevronRight size={18} /></button></div></nav>}</>}
        </div>
      </main>
    </ProtectedRoute>
  );
}
