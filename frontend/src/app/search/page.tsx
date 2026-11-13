"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Newspaper,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { clearSearch, setSearchRequest } from "@/redux/features/search/searchSlice";
import { useSearchQuery } from "@/redux/features/search/searchApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { SearchCompany, SearchJob, SearchPerson, SearchPost, SearchType } from "@/types/search.types";

const PAGE_SIZE = 10;
const categories: { id: SearchType; label: string; icon: typeof Search }[] = [
  { id: "all", label: "All", icon: Search },
  { id: "people", label: "People", icon: UsersRound },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "posts", label: "Posts", icon: Newspaper },
  { id: "companies", label: "Companies", icon: Building2 },
];

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "P";
}

function ResultCard({ result }: { result: SearchPerson | SearchJob | SearchPost | SearchCompany }) {
  if (result._type === "people") {
    const href = `/profile/${result._id}`;
    return (
      <Link href={href} className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary-200 hover:shadow-md">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-50 font-bold text-primary-800">{initials(result.firstName, result.lastName)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 font-bold text-slate-900 group-hover:text-primary-800">{result.firstName} {result.lastName}<ArrowUpRight size={15} className="opacity-0 transition group-hover:opacity-100" /></span>
          <span className="mt-0.5 block text-sm text-slate-500">@{result.username} · {result.role}</span>
          {result.profile?.headline && <span className="mt-2 block text-sm font-medium text-slate-700">{result.profile.headline}</span>}
          {result.profile?.location && <span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{result.profile.location}</span>}
          {!!result.profile?.skills?.length && <span className="mt-3 flex flex-wrap gap-1.5">{result.profile.skills.slice(0, 5).map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{skill}</span>)}</span>}
        </span>
      </Link>
    );
  }
  if (result._type === "jobs") {
    return (
      <Link href={`/jobs/${result._id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary-200 hover:shadow-md">
        <span className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BriefcaseBusiness size={19} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-bold text-slate-900 group-hover:text-primary-800">{result.title}<ArrowUpRight size={15} className="opacity-0 transition group-hover:opacity-100" /></span><span className="mt-1 block text-sm text-slate-500">{result.company?.name ?? `${result.postedBy?.firstName ?? "Hiring team"} ${result.postedBy?.lastName ?? ""}`} · {result.location}</span><span className="mt-3 flex flex-wrap gap-1.5">{result.jobType && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{result.jobType}</span>}{result.experienceLevel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{result.experienceLevel}</span>}{result.isRemote && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Remote</span>}</span></span></span>
      </Link>
    );
  }
  if (result._type === "posts") {
    return (
      <Link href={`/posts/${result._id}`} className="group block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary-200 hover:shadow-md">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:text-primary-800"><Newspaper size={16} className="text-violet-600" />{result.author.firstName} {result.author.lastName}<span className="font-normal text-slate-400">@{result.author.username}</span></span>
        <span className="mt-3 line-clamp-4 block whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.content}</span>
        <span className="mt-3 block text-xs text-slate-400">{result.createdAt.slice(0, 10)}</span>
      </Link>
    );
  }
  return (
    <Link href={`/companies/${result._id}`} className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary-200 hover:shadow-md">
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-amber-50 text-amber-700">{result.logo ? <img src={result.logo} alt="" className="h-full w-full object-cover" /> : <Building2 size={21} />}</span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2 font-bold text-slate-900 group-hover:text-primary-800">{result.name}{result.isVerified && <BadgeCheck size={16} className="text-blue-600" />}<ArrowUpRight size={15} className="opacity-0 transition group-hover:opacity-100" /></span>{result.industry && <span className="mt-1 block text-sm text-slate-500">{result.industry}{result.location ? ` · ${result.location}` : ""}</span>}{result.description && <span className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-600">{result.description}</span>}</span>
    </Link>
  );
}

function SearchPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { query, activeType, searchMode, page } = useAppSelector((state) => state.search);
  const [input, setInput] = useState("");
  const { currentData, isFetching, isError, refetch } = useSearchQuery(
    { q: query, type: activeType, mode: searchMode, page, limit: PAGE_SIZE },
    { skip: query.trim().length === 0 }
  );
  const resultData = currentData?.data;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    const type = params.get("type") as SearchType | null;
    const mode = params.get("mode") === "smart" ? "smart" : "keyword";
    setInput(q);
    if (!q) dispatch(clearSearch());
    else dispatch(setSearchRequest({ query: q, activeType: categories.some((item) => item.id === type) ? type! : "all", searchMode: mode, page: 1 }));
  }, [dispatch]);

  const updateUrl = (next: { q: string; type: SearchType; mode: "keyword" | "smart" }) => {
    const params = new URLSearchParams({ q: next.q, type: next.type, mode: next.mode });
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = input.trim();
    if (!nextQuery) return;
    dispatch(setSearchRequest({ query: nextQuery, page: 1 }));
    updateUrl({ q: nextQuery, type: activeType, mode: searchMode });
  };

  const selectType = (type: SearchType) => {
    dispatch(setSearchRequest({ activeType: type, page: 1 }));
    if (query) updateUrl({ q: query, type, mode: searchMode });
  };

  const selectMode = (mode: "keyword" | "smart") => {
    dispatch(setSearchRequest({ searchMode: mode, page: 1 }));
    if (query) updateUrl({ q: query, type: activeType, mode });
  };

  const setPage = (nextPage: number) => {
    dispatch(setSearchRequest({ page: nextPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ProtectedRoute>
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-700">Discover ProLink</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Search across your professional world</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Find people, opportunities, posts, and companies from one place.</p></header>

          <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
            <label className="relative flex-1"><span className="sr-only">Search people, jobs, posts, and companies</span><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try a name, skill, job title, or company" className="h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50" /></label>
            <button type="submit" disabled={!input.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-800 px-6 text-sm font-bold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"><Search size={16} />Search</button>
          </form>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <nav aria-label="Search categories" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
              {categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => selectType(id)} aria-pressed={activeType === id} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${activeType === id ? "bg-primary-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={15} />{label}</button>)}
            </nav>
            <div className="flex items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 sm:self-auto" aria-label="Search mode">
              <button type="button" onClick={() => selectMode("keyword")} aria-pressed={searchMode === "keyword"} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${searchMode === "keyword" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Keyword</button>
              <button type="button" onClick={() => selectMode("smart")} aria-pressed={searchMode === "smart"} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${searchMode === "smart" ? "bg-violet-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Sparkles size={13} />Smart match</button>
            </div>
          </div>

          {!query ? (
            <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-700"><Search size={25} /></span><h2 className="mt-4 text-lg font-bold text-slate-900">Start with a search</h2><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">Search by name, skills, role, company, or opportunity. Choose Smart Match to include semantically related results.</p></section>
          ) : (
            <section className="mt-6">
              <div className="mb-3 flex min-h-8 items-center justify-between gap-3"><p className="text-sm text-slate-500">Results for <strong className="text-slate-800">“{query}”</strong>{resultData && <span> · {resultData.pagination.total} found</span>}</p>{isFetching && <span role="status" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500"><LoaderCircle size={14} className="animate-spin" />Searching</span>}</div>
              {isError ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-8 text-center"><p className="font-semibold text-slate-900">Search is temporarily unavailable</p><p className="mt-1 text-sm text-slate-500">Please try again in a moment.</p><button type="button" onClick={() => void refetch()} className="mt-4 rounded-xl bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-900">Try again</button></div>
                : isFetching && !resultData ? <div role="status" className="grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white"><LoaderCircle className="animate-spin text-primary-700" size={24} /></div>
                  : resultData?.results.length ? <div className="space-y-3">{resultData.results.map((result) => <ResultCard key={`${result._type}:${result._id}`} result={result} />)}</div>
                    : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"><p className="font-bold text-slate-900">No matching results</p><p className="mt-1 text-sm text-slate-500">Try another phrase or switch to Smart Match.</p></div>}

              {!!resultData && resultData.pagination.totalPages > 1 && <nav aria-label="Search result pages" className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"><p className="text-sm text-slate-500">Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{resultData.pagination.totalPages}</strong></p><span className="flex gap-2"><button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1 || isFetching} aria-label="Previous results page" className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={18} /></button><button type="button" onClick={() => setPage(page + 1)} disabled={page >= resultData.pagination.totalPages || isFetching} aria-label="Next results page" className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={18} /></button></span></nav>}
            </section>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function SearchPage() {
  return <SearchPageContent />;
}
