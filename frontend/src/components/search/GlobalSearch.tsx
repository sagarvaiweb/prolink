"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type Ref } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  Clock3,
  LoaderCircle,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { emptySearchFilters, setSearchRequest } from "@/redux/features/search/searchSlice";
import {
  useAutocompleteQuery,
  useClearRecentSearchesMutation,
  useDeleteRecentSearchMutation,
  useGetRecentSearchesQuery,
} from "@/redux/features/search/searchApi";
import type { RecentSearch, SearchType } from "@/types/search.types";

const MIN_QUERY_LENGTH = 2;
const RECENT_LIMIT = 6;
const LISTBOX_ID = "global-search-options";

function searchHref(query: string, type: SearchType) {
  const params = new URLSearchParams({ q: query, type, mode: "keyword" });
  return `/search?${params.toString()}`;
}

function SearchTypeIcon({ type }: { type: SearchType }) {
  if (type === "people") return <UsersRound size={15} />;
  if (type === "companies") return <Building2 size={15} />;
  return <Search size={15} />;
}

function SearchField({
  value,
  onChange,
  onSubmit,
  onFocus,
  onKeyDown,
  onClear,
  inputRef,
  isOpen,
  activeIndex,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
  inputRef?: Ref<HTMLInputElement>;
  isOpen: boolean;
  activeIndex: number;
}) {
  return (
    <form onSubmit={onSubmit} role="search" className="relative flex w-full items-center">
      <Search size={17} className="pointer-events-none absolute left-3.5 text-slate-400" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-label="Search ProLink"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? LISTBOX_ID : undefined}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `${LISTBOX_ID}-${activeIndex}` : undefined}
        placeholder="Search people, jobs, companies…"
        className={`h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50 ${value ? "pr-10" : "pr-3"}`}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={onClear}
          className="absolute right-2 grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={15} />
        </button>
      )}
    </form>
  );
}

function RecentSearchPanel({
  searches,
  isLoading,
  activeIndex,
  onSelect,
  onHover,
  onRemove,
  onClearAll,
}: {
  searches: RecentSearch[];
  isLoading: boolean;
  activeIndex: number;
  onSelect: (search: RecentSearch) => void;
  onHover: (index: number) => void;
  onRemove: (event: ReactMouseEvent<HTMLButtonElement>, id: string) => void;
  onClearAll: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Your search history</p>
          <p className="mt-0.5 text-xs text-slate-500">Pick up where you left off</p>
        </div>
        {searches.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Clear all
          </button>
        )}
      </div>
      <div id={LISTBOX_ID} role="listbox" aria-label="Recent searches" className="max-h-[min(55vh,22rem)] overflow-y-auto p-2">
        {isLoading ? (
          <div role="status" className="flex items-center justify-center gap-2 px-3 py-7 text-sm text-slate-500">
            <LoaderCircle size={15} className="animate-spin" />Loading recent searches
          </div>
        ) : searches.length ? (
          searches.map((recent, index) => (
            <div
              key={recent._id}
              className={`group flex items-center gap-2 rounded-xl px-2 py-1 transition ${activeIndex === index ? "bg-primary-50" : "hover:bg-slate-50"}`}
            >
              <button
                type="button"
                id={`${LISTBOX_ID}-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onMouseEnter={() => onHover(index)}
                onClick={() => onSelect(recent)}
                className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2.5 text-left"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <Clock3 size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-800">{recent.query}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] capitalize text-slate-400">
                    <SearchTypeIcon type={recent.type} />{recent.type}
                  </span>
                </span>
                <ArrowUpRight size={14} className="text-slate-300 opacity-0 transition group-hover:opacity-100" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${recent.query} from recent searches`}
                onClick={(event) => onRemove(event, recent._id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 opacity-0 transition hover:bg-white hover:text-rose-600 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400"><Clock3 size={17} /></span>
            <p className="mt-3 text-sm font-semibold text-slate-700">No recent searches yet</p>
            <p className="mt-1 text-xs text-slate-500">Your searches will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
}

function SuggestionPanel({
  query,
  suggestions,
  isLoading,
  isReady,
  activeIndex,
  onSelect,
  onHover,
}: {
  query: string;
  suggestions: string[];
  isLoading: boolean;
  isReady: boolean;
  activeIndex: number;
  onSelect: (query: string) => void;
  onHover: (index: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Suggestions</p>
          <p className="mt-0.5 text-xs text-slate-500">Search for “{query}”</p>
        </div>
        {isLoading && <LoaderCircle size={15} className="animate-spin text-primary-600" />}
      </div>
      <div id={LISTBOX_ID} role="listbox" aria-label="Search suggestions" className="max-h-[min(55vh,22rem)] overflow-y-auto p-2">
        {query.trim().length < MIN_QUERY_LENGTH ? (
          <p className="px-4 py-6 text-center text-xs leading-5 text-slate-500">Type at least {MIN_QUERY_LENGTH} characters to see suggestions.</p>
        ) : !isReady ? (
          <div role="status" className="flex items-center justify-center gap-2 px-4 py-6 text-xs text-slate-500">
            <LoaderCircle size={14} className="animate-spin" />Finding suggestions
          </div>
        ) : suggestions.length ? (
          suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              id={`${LISTBOX_ID}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseEnter={() => onHover(index)}
              onClick={() => onSelect(suggestion)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeIndex === index ? "bg-primary-50" : "hover:bg-slate-50"}`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700"><Search size={15} /></span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{suggestion}</span>
              <ArrowUpRight size={14} className="text-slate-300" />
            </button>
          ))
        ) : !isLoading ? (
          <div className="px-4 py-7 text-center">
            <p className="text-sm font-semibold text-slate-700">No quick suggestions</p>
            <p className="mt-1 text-xs text-slate-500">Press Enter to search all results.</p>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <span className="text-[10px] font-medium text-slate-400"><kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5">↑</kbd> <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5">↓</kbd> to navigate</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700"><Sparkles size={12} />Smart Match on results</span>
      </div>
    </>
  );
}

export default function GlobalSearch() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const currentSearch = useAppSelector((state) => state.search);
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (pathname.startsWith("/search")) setValue(currentSearch.query);
  }, [currentSearch.query, pathname]);

  useEffect(() => {
    if (isMobileOpen) mobileInputRef.current?.focus();
  }, [isMobileOpen]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  const suggestionInputReady = value.trim().length >= MIN_QUERY_LENGTH && value.trim() === debouncedValue;
  const canSuggest = isOpen && suggestionInputReady;
  const { currentData: autocompleteData, isFetching: isSuggesting } = useAutocompleteQuery(debouncedValue, {
    skip: !canSuggest,
  });
  const { currentData: recentData, isFetching: isLoadingRecent } = useGetRecentSearchesQuery(undefined, {
    skip: !isOpen || value.trim().length > 0,
  });
  const [deleteRecent] = useDeleteRecentSearchMutation();
  const [clearRecent] = useClearRecentSearchesMutation();

  const suggestions = autocompleteData?.data.suggestions ?? [];
  const recentSearches = (recentData?.data.searches ?? []).slice(0, RECENT_LIMIT);
  const showingRecent = value.trim().length === 0;
  const rowsCount = showingRecent ? recentSearches.length : suggestionInputReady ? suggestions.length : 0;

  const goToSearch = (query: string, type: SearchType = "all") => {
    const normalized = query.trim();
    if (!normalized) return;
    dispatch(setSearchRequest({ query: normalized, activeType: type, searchMode: "keyword", page: 1, filters: emptySearchFilters }));
    setValue(normalized);
    setIsOpen(false);
    setIsMobileOpen(false);
    router.push(searchHref(normalized, type));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && rowsCount) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % rowsCount);
    } else if (event.key === "ArrowUp" && rowsCount) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? rowsCount - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      if (showingRecent) {
        const selected = recentSearches[activeIndex];
        if (selected) goToSearch(selected.query, selected.type);
      } else {
        const selected = suggestions[activeIndex];
        if (selected) goToSearch(selected);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      event.currentTarget.blur();
    }
  };

  const removeRecent = async (event: ReactMouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await deleteRecent(id).unwrap();
    } catch {
      // Keep the recent list open so the user can continue searching.
    }
  };

  const clearAll = async () => {
    try {
      await clearRecent().unwrap();
    } catch {
      // Keep the recent panel visible if clearing fails.
    }
  };

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    setActiveIndex(-1);
  };

  const clearInput = () => {
    setValue("");
    setDebouncedValue("");
    setActiveIndex(-1);
    (isMobileOpen ? mobileInputRef.current : desktopInputRef.current)?.focus();
  };

  const fieldProps = {
    value,
    onChange: handleChange,
    onSubmit: submit,
    onFocus: () => setIsOpen(true),
    onKeyDown: handleKeyDown,
    onClear: clearInput,
    isOpen,
    activeIndex,
  };

  const selectRecent = (recent: RecentSearch) => goToSearch(recent.query, recent.type);

  return (
    <div ref={rootRef} className="relative">
      <div className="hidden w-[min(28vw,20rem)] lg:block xl:w-80">
        <SearchField {...fieldProps} inputRef={desktopInputRef} />
      </div>
      <button
        type="button"
        aria-label="Open search"
        onClick={() => { setIsMobileOpen(true); setIsOpen(true); }}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-800 lg:hidden"
      >
        <Search size={18} />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close search suggestions"
            tabIndex={-1}
            onClick={() => { setIsOpen(false); setIsMobileOpen(false); }}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/20 backdrop-blur-[1px] lg:hidden"
          />
          <section
            aria-label="Search suggestions"
            className={`absolute z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_-24px_rgba(15,23,42,0.35)] ${isMobileOpen ? "fixed inset-x-3 top-3 mt-0 w-auto p-3 lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2 lg:w-[26rem]" : "right-0 top-full hidden w-[26rem] lg:block"}`}
          >
            {isMobileOpen && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => { setIsOpen(false); setIsMobileOpen(false); }}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <SearchField {...fieldProps} inputRef={mobileInputRef} />
                </div>
              </div>
            )}
            {showingRecent ? (
              <RecentSearchPanel
                searches={recentSearches}
                isLoading={isLoadingRecent}
                activeIndex={activeIndex}
                onSelect={selectRecent}
                onHover={setActiveIndex}
                onRemove={removeRecent}
                onClearAll={() => void clearAll()}
              />
            ) : (
              <SuggestionPanel
                query={value}
                suggestions={suggestions}
                isLoading={isSuggesting}
                isReady={suggestionInputReady}
                activeIndex={activeIndex}
                onSelect={(suggestion) => goToSearch(suggestion)}
                onHover={setActiveIndex}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
