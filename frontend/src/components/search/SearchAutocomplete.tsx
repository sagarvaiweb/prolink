"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  Building2,
  BriefcaseBusiness,
  LoaderCircle,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useAutocompleteQuery } from "@/redux/features/search/searchApi";
import type { SearchCategory, SearchSuggestion } from "@/types/search.types";

const suggestionIcons = {
  person: UserRound,
  job: BriefcaseBusiness,
  company: Building2,
};

const suggestionLabels = {
  person: "Person",
  job: "Job",
  company: "Company",
};

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export default function SearchAutocomplete({
  initialQuery,
  category,
  onSearch,
  onClear,
}: {
  initialQuery: string;
  category: SearchCategory;
  onSearch: (query: string) => void;
  onClear: () => void;
}) {
  const [input, setInput] = useState(initialQuery);
  const [debouncedInput, setDebouncedInput] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const query = normalizeQuery(debouncedInput);
  const supportsSuggestions = category !== "posts";
  const autocompleteType = category === "all" ? "all" : category;
  const autocomplete = useAutocompleteQuery(
    { q: query, type: autocompleteType },
    { skip: !supportsSuggestions || query.length < 2 }
  );
  const suggestions = autocomplete.currentData?.data.suggestions ?? [];
  const showPanel = isOpen && supportsSuggestions && input.trim().length >= 2;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedInput(input), 220);
    return () => window.clearTimeout(timeout);
  }, [input]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const submit = (value: string) => {
    const normalized = normalizeQuery(value);
    if (!normalized) return;
    setInput(normalized);
    setIsOpen(false);
    onSearch(normalized);
  };

  const chooseSuggestion = (suggestion: SearchSuggestion) => {
    submit(suggestion.title);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (showPanel && activeIndex >= 0 && suggestions[activeIndex]) {
      chooseSuggestion(suggestions[activeIndex]);
      return;
    }
    submit(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!showPanel || !suggestions.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <div ref={wrapperRef} className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="sr-only">Search ProLink</span>
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showPanel}
            aria-controls={showPanel && suggestions.length ? listId : undefined}
            aria-activedescendant={
              showPanel && suggestions[activeIndex]
                ? `${listId}-${activeIndex}`
                : undefined
            }
            value={input}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setInput(event.target.value);
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            maxLength={100}
            placeholder="Try 'React developer' or 'product design'"
            className="h-[52px] w-full rounded-xl border border-white/20 bg-white px-11 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-200/20"
          />
        </label>
        <span className="absolute right-3 top-[26px] -translate-y-1/2">
          {autocomplete.isFetching && query.length >= 2 && supportsSuggestions ? (
            <LoaderCircle
              size={17}
              aria-label="Loading suggestions"
              className="animate-spin text-primary-600"
            />
          ) : input ? (
            <button
              type="button"
              aria-label="Clear search query"
              onClick={() => {
                setInput("");
                setDebouncedInput("");
                setActiveIndex(-1);
                setIsOpen(false);
                onClear();
              }}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500"
            >
              <X size={16} />
            </button>
          ) : null}
        </span>

        {showPanel && (
          <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between px-3 pb-2 pt-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Suggestions
              </p>
              <span className="text-[11px] font-medium text-slate-400">Use arrow keys to navigate</span>
            </div>

            {autocomplete.isError ? (
              <p role="status" className="px-3 py-4 text-sm text-slate-500">
                Suggestions are unavailable right now. You can still search.
              </p>
            ) : autocomplete.isFetching && !autocomplete.currentData ? (
              <p role="status" className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500">
                <LoaderCircle size={15} className="animate-spin" /> Finding matches...
              </p>
            ) : suggestions.length ? (
              <ul id={listId} role="listbox" aria-label="Search suggestions">
                {suggestions.map((suggestion, index) => {
                  const Icon = suggestionIcons[suggestion.entityType];
                  const selected = index === activeIndex;

                  return (
                    <li
                      key={`${suggestion.entityType}:${suggestion.entityId}`}
                      role="presentation"
                    >
                      <button
                        type="button"
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={selected}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => chooseSuggestion(suggestion)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          selected ? "bg-primary-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-primary-800">
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {suggestion.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {suggestion.subtitle || suggestionLabels[suggestion.entityType]}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          {suggestionLabels[suggestion.entityType]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3 py-4 text-sm text-slate-500">
                No suggestions yet. Press Enter to search for &quot;{input.trim()}&quot;.
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="h-[52px] rounded-xl bg-amber-300 px-6 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
      >
        Search
      </button>
    </form>
  );
}
