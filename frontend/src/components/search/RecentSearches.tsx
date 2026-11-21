"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  History,
  LoaderCircle,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useClearRecentSearchesMutation,
  useDeleteRecentSearchMutation,
  useRecentSearchesQuery,
} from "@/redux/features/search/searchApi";
import type { RecentSearchEntry, SearchCategory } from "@/types/search.types";

const categoryLabels: Record<SearchCategory, string> = {
  all: "All results",
  people: "People",
  jobs: "Jobs",
  posts: "Posts",
  companies: "Companies",
};

const categoryIcons: Record<SearchCategory, typeof UserRound> = {
  all: Search,
  people: UserRound,
  jobs: BriefcaseBusiness,
  posts: History,
  companies: Building2,
};

function getSearchCategory(entry: RecentSearchEntry): SearchCategory {
  return entry.entityTypes.length === 1 ? entry.entityTypes[0] : "all";
}

function formatSearchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function RecentSearches({
  onSelect,
}: {
  onSelect: (query: string, category: SearchCategory) => void;
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionError, setActionError] = useState(false);
  const recentQuery = useRecentSearchesQuery();
  const [deleteSearch, deleteState] = useDeleteRecentSearchMutation();
  const [clearSearches, clearState] = useClearRecentSearchesMutation();
  const entries = recentQuery.currentData?.data ?? [];
  const isMutating = deleteState.isLoading || clearState.isLoading;

  const removeEntry = async (id: string) => {
    setActionError(false);
    try {
      await deleteSearch(id).unwrap();
    } catch {
      setActionError(true);
    }
  };

  const clearHistory = async () => {
    setActionError(false);
    try {
      await clearSearches().unwrap();
      setConfirmClear(false);
    } catch {
      setActionError(true);
    }
  };

  return (
    <section
      aria-labelledby="recent-searches-title"
      className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-800">
            <History size={19} />
          </span>
          <div>
            <h2 id="recent-searches-title" className="text-base font-bold text-slate-900">
              Recent searches
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Pick up where you left off.
            </p>
          </div>
        </div>

        {entries.length > 0 && !confirmClear && (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:self-center"
          >
            <Trash2 size={15} /> Clear history
          </button>
        )}
      </div>

      {confirmClear && (
        <div
          role="alertdialog"
          aria-labelledby="clear-history-title"
          aria-describedby="clear-history-description"
          className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <p id="clear-history-title" className="text-sm font-bold text-slate-900">
              Clear your recent searches?
            </p>
            <p id="clear-history-description" className="mt-1 text-sm text-slate-600">
              This removes the saved search history from your account.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={clearState.isLoading}
              onClick={() => setConfirmClear(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={clearState.isLoading}
              onClick={() => void clearHistory()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {clearState.isLoading && <LoaderCircle size={15} className="animate-spin" />}
              Clear searches
            </button>
          </div>
        </div>
      )}

      {recentQuery.isLoading ? (
        <ul aria-label="Loading recent searches" className="divide-y divide-slate-100">
          {[0, 1, 2].map((item) => (
            <li key={item} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <span className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              <span className="flex-1 space-y-2">
                <span className="block h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                <span className="block h-2.5 w-1/4 animate-pulse rounded bg-slate-100" />
              </span>
            </li>
          ))}
        </ul>
      ) : recentQuery.isError ? (
        <div className="px-5 py-8 text-center sm:px-6">
          <AlertCircle size={19} className="mx-auto text-amber-600" />
          <p className="mt-2 text-sm font-semibold text-slate-800">
            Your search history couldn’t load.
          </p>
          <button
            type="button"
            onClick={() => void recentQuery.refetch()}
            className="mt-2 text-sm font-semibold text-primary-800 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : entries.length ? (
        <ul className="divide-y divide-slate-100">
          {entries.map((entry) => {
            const category = getSearchCategory(entry);
            const Icon = categoryIcons[category];
            const isDeleting = deleteState.isLoading && deleteState.originalArgs === entry.id;

            return (
              <li
                key={entry.id}
                className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80 sm:gap-4 sm:px-6"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-primary-50 group-hover:text-primary-800">
                  <Icon size={17} />
                </span>
                <button
                  type="button"
                  onClick={() => onSelect(entry.query, category)}
                  className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {entry.query}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-slate-300 transition group-hover:text-primary-700"
                    />
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} /> {formatSearchedAt(entry.searchedAt)}
                    </span>
                    <span>{categoryLabels[category]}</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove “${entry.query}” from recent searches`}
                  title="Remove search"
                  disabled={isMutating}
                  onClick={() => void removeEntry(entry.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isDeleting ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <X size={17} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center sm:px-6">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            <Search size={19} />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-800">Your next search starts here.</p>
          <p className="mt-1 text-sm text-slate-500">
            Searches you make will show up here for quick access.
          </p>
        </div>
      )}

      {actionError && (
        <p role="alert" className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-800 sm:px-6">
          <AlertCircle size={16} /> Couldn’t update your search history. Please try again.
        </p>
      )}
    </section>
  );
}
