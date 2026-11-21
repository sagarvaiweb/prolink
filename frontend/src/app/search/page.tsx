"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import SearchEmptyState from "@/components/search/SearchEmptyState";
import SearchAutocomplete from "@/components/search/SearchAutocomplete";
import SearchFilters from "@/components/search/SearchFilters";
import SearchLoading from "@/components/search/SearchLoading";
import SearchResults from "@/components/search/SearchResults";
import { useSearchQuery } from "@/redux/features/search/searchApi";
import {
  setActiveType,
  setFilters,
  setQuery,
  setSearchMode,
  setSearchPage,
  setSearchState,
} from "@/redux/features/search/searchSlice";
import { useAppDispatch } from "@/redux/hooks";
import type {
  SearchCategory,
  SearchFilters as SearchFilterValues,
  SearchMode,
  SearchState,
} from "@/types/search.types";

const PAGE_SIZE = 10;

const categories: { value: SearchCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "people", label: "People" },
  { value: "jobs", label: "Jobs" },
  { value: "posts", label: "Posts" },
  { value: "companies", label: "Companies" },
];

const modes: { value: SearchMode; label: string }[] = [
  { value: "hybrid", label: "Smart Match" },
  { value: "keyword", label: "Keyword" },
  { value: "semantic", label: "Semantic" },
];

const categoriesSet = new Set<SearchCategory>([
  "all",
  "people",
  "jobs",
  "posts",
  "companies",
]);
const modesSet = new Set<SearchMode>(["keyword", "semantic", "hybrid"]);
const filterFieldsByCategory: Record<
  SearchCategory,
  (keyof SearchFilterValues)[]
> = {
  all: ["location", "skills", "industry"],
  people: ["location", "skills", "role", "title"],
  jobs: [
    "location",
    "skills",
    "experienceLevel",
    "employmentType",
    "salaryRange",
    "industry",
  ],
  posts: ["author", "dateFrom", "dateTo"],
  companies: ["location", "industry"],
};

const roles = ["student", "professional", "recruiter", "admin"];
const experienceLevels = ["entry", "mid", "senior"];
const employmentTypes = ["full-time", "part-time", "internship", "contract"];

function readSearchFilters(
  params: URLSearchParams,
  category: SearchCategory
): SearchFilterValues {
  const filters: SearchFilterValues = {};
  const readText = (
    key: "location" | "skills" | "title" | "salaryRange" | "industry",
    maxLength: number
  ) => {
    const value = params.get(key)?.trim();
    if (value && value.length <= maxLength) filters[key] = value;
  };

  for (const key of filterFieldsByCategory[category]) {
    if (key === "location") readText(key, 150);
    if (key === "skills") readText(key, 1000);
    if (key === "title") readText(key, 120);
    if (key === "salaryRange") readText(key, 100);
    if (key === "industry") readText(key, 100);
    if (key === "role") {
      const value = params.get(key);
      if (value && roles.includes(value)) filters.role = value;
    }
    if (key === "experienceLevel") {
      const value = params.get(key);
      if (value && experienceLevels.includes(value)) {
        filters.experienceLevel = value;
      }
    }
    if (key === "employmentType") {
      const value = params.get(key);
      if (value && employmentTypes.includes(value)) {
        filters.employmentType = value;
      }
    }
    if (key === "author") {
      const value = params.get(key);
      if (value && /^[a-f\d]{24}$/i.test(value)) filters.author = value;
    }
    if (key === "dateFrom" || key === "dateTo") {
      const value = params.get(key);
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (
          !Number.isNaN(date.getTime()) &&
          date.toISOString().slice(0, 10) === value
        ) {
          filters[key] = value;
        }
      }
    }
  }

  if (filters.skills) {
    const skills = filters.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    if (skills.length > 20 || skills.some((skill) => skill.length > 50)) {
      delete filters.skills;
    } else {
      filters.skills = [...new Set(skills.map((skill) => skill.toLowerCase()))].join(",");
    }
  }

  if (
    filters.dateFrom &&
    filters.dateTo &&
    new Date(filters.dateFrom).getTime() > new Date(filters.dateTo).getTime()
  ) {
    delete filters.dateFrom;
    delete filters.dateTo;
  }

  return filters;
}

function filterValuesForCategory(
  filters: SearchFilterValues,
  category: SearchCategory
): SearchFilterValues {
  return Object.fromEntries(
    Object.entries(filters).filter(([key, value]) =>
      filterFieldsByCategory[category].includes(key as keyof SearchFilterValues) &&
      Boolean(value)
    )
  ) as SearchFilterValues;
}

function parseSearchState(params: URLSearchParams): SearchState {
  const type = params.get("type") as SearchCategory | null;
  const mode = params.get("mode") as SearchMode | null;
  const page = Number(params.get("page") || 1);

  return {
    query: (params.get("q") || "").trim().slice(0, 100),
    activeType: type && categoriesSet.has(type) ? type : "all",
    searchMode: mode && modesSet.has(mode) ? mode : "hybrid",
    activeFilters: readSearchFilters(
      params,
      type && categoriesSet.has(type) ? type : "all"
    ),
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 100) : 1,
  };
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const paramsKey = searchParams.toString();
  const urlState = useMemo(
    () => parseSearchState(new URLSearchParams(paramsKey)),
    [paramsKey]
  );
  const { query, activeType, searchMode, activeFilters, page } = urlState;
  const hasSubmitted = Boolean(query);

  useEffect(() => {
    dispatch(setSearchState(urlState));
  }, [dispatch, urlState]);

  const searchRequest = useMemo(
    () => ({
      q: query,
      type: activeType,
      mode: searchMode,
      ...activeFilters,
      page,
      limit: PAGE_SIZE,
    }),
    [query, activeType, searchMode, activeFilters, page]
  );
  const searchQuery = useSearchQuery(searchRequest, { skip: !query });
  const result = searchQuery.currentData?.data;

  const updateUrl = (next: SearchState) => {
    const params = new URLSearchParams();
    if (next.query) params.set("q", next.query);
    params.set("type", next.activeType);
    params.set("mode", next.searchMode);
    params.set("page", String(next.page));
    for (const [key, value] of Object.entries(next.activeFilters)) {
      if (value) params.set(key, value);
    }
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (nextQuery: string) => {
    dispatch(setQuery(nextQuery));
    const next = {
      query: nextQuery,
      activeType,
      searchMode,
      activeFilters: {},
      page: 1,
    } satisfies SearchState;
    dispatch(setSearchPage(1));
    updateUrl(next);
  };

  const updateCategory = (type: SearchCategory) => {
    dispatch(setActiveType(type));
    const nextFilters = filterValuesForCategory(activeFilters, type);
    dispatch(setFilters(nextFilters));
    const next = {
      query,
      activeType: type,
      searchMode,
      activeFilters: nextFilters,
      page: 1,
    } satisfies SearchState;
    updateUrl(next);
  };

  const updateMode = (mode: SearchMode) => {
    dispatch(setSearchMode(mode));
    const next = {
      query,
      activeType,
      searchMode: mode,
      activeFilters,
      page: 1,
    } satisfies SearchState;
    updateUrl(next);
  };

  const updatePage = (nextPage: number) => {
    dispatch(setSearchPage(nextPage));
    updateUrl({
      query,
      activeType,
      searchMode,
      activeFilters,
      page: nextPage,
    });
  };

  const updateFilters = (nextFilters: SearchFilterValues) => {
    dispatch(setFilters(nextFilters));
    dispatch(setSearchPage(1));
    updateUrl({
      query,
      activeType,
      searchMode,
      activeFilters: nextFilters,
      page: 1,
    });
  };

  const errorMessage = searchQuery.error
    ? "Search is temporarily unavailable. Please try again."
    : "";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/feed"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} /> Back to feed
          </Link>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-primary-950 to-primary-800 px-6 py-8 text-white shadow-lg shadow-primary-950/10 sm:px-9 sm:py-10">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10"
            />
            <div className="relative max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                <Sparkles size={15} /> ProLink discovery
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Find your next connection
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Search people, open roles, conversations, and companies from one place.
              </p>

              <SearchAutocomplete
                key={`${query}:${activeType}`}
                initialQuery={query}
                category={activeType}
                onSearch={handleSearch}
              />
            </div>
          </section>

          {hasSubmitted && query && (
            <section className="mt-7" aria-label="Search results">
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Search results for
                  </p>
                  <p className="mt-1 truncate text-base font-bold text-slate-900">
                    “{query}”
                  </p>
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                  <span>Search mode</span>
                  <select
                    value={searchMode}
                    onChange={(event) => updateMode(event.target.value as SearchMode)}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100"
                  >
                    {modes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                role="tablist"
                aria-label="Search categories"
                className="mt-4 flex gap-2 overflow-x-auto pb-1"
              >
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    role="tab"
                    aria-selected={activeType === category.value}
                    onClick={() => updateCategory(category.value)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                      activeType === category.value
                        ? "bg-primary-900 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-800"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="lg:sticky lg:top-5">
                  <SearchFilters
                    key={`${activeType}:${JSON.stringify(activeFilters)}`}
                    category={activeType}
                    filters={activeFilters}
                    onApply={updateFilters}
                  />
                </aside>
                <div className="min-w-0">
              {result?.fallbackUsed && (
                <p
                  role="status"
                  className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                  Smart search is temporarily unavailable. These results use keyword matching.
                </p>
              )}

              {searchQuery.isError && (
                <div
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
                >
                  <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => void searchQuery.refetch()}
                    className="mt-2 text-sm font-semibold text-red-800 underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              )}

              {searchQuery.isFetching ? (
                <div className="mt-5">
                  <SearchLoading />
                </div>
              ) : result && result.results.length > 0 ? (
                <div className="mt-5 space-y-5">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                    <p>
                      {result.pagination.total.toLocaleString()} result
                      {result.pagination.total === 1 ? "" : "s"}
                    </p>
                    {result.mode !== searchMode && (
                      <p className="text-xs font-medium text-amber-800">
                        Showing {result.mode} results
                      </p>
                    )}
                  </div>
                  <SearchResults results={result.results} />
                  {result.pagination.totalPages > 1 && (
                    <nav
                      aria-label="Search result pages"
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
                    >
                      <p className="text-sm text-slate-500">
                        Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
                        <span className="font-semibold text-slate-800">
                          {result.pagination.totalPages}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label="Previous search results page"
                          disabled={page <= 1 || searchQuery.isFetching}
                          onClick={() => updatePage(page - 1)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          aria-label="Next search results page"
                          disabled={page >= result.pagination.totalPages || searchQuery.isFetching}
                          onClick={() => updatePage(page + 1)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </nav>
                  )}
                </div>
              ) : result && !searchQuery.isError ? (
                <div className="mt-5">
                  <SearchEmptyState query={query} />
                </div>
              ) : null}
                </div>
              </div>
            </section>
          )}

          {!hasSubmitted && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-800">
                <Search size={21} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Start with a name, skill, or idea
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Smart Match combines keyword and meaning-based search. Choose Keyword for exact terms.
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 px-4 py-10"><SearchLoading /></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
