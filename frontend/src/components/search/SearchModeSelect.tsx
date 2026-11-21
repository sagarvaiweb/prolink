"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { SearchMode } from "@/types/search.types";

const modes: {
  value: SearchMode;
  label: string;
  description: string;
}[] = [
  {
    value: "hybrid",
    label: "Smart Match",
    description: "Combines exact terms with meaning",
  },
  {
    value: "keyword",
    label: "Keyword",
    description: "Matches the words you enter",
  },
  {
    value: "semantic",
    label: "Semantic",
    description: "Finds results with a similar meaning",
  },
];

export default function SearchModeSelect({
  value,
  onChange,
}: {
  value: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedMode = modes.find((mode) => mode.value === value) ?? modes[0];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const selectMode = (mode: SearchMode) => {
    onChange(mode);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative flex shrink-0 flex-col gap-1.5">
      <span className="pl-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        Search mode
      </span>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="search-mode-options"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-w-40 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left shadow-sm transition hover:border-primary-300 hover:bg-primary-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100"
      >
        <span className="text-sm font-bold text-slate-800">
          {selectedMode.label}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          id="search-mode-options"
          role="group"
          aria-label="Choose a search mode"
          className="absolute right-0 top-full z-30 mt-2 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
        >
          {modes.map((mode) => {
            const isSelected = mode.value === value;

            return (
              <button
                key={mode.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectMode(mode.value)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isSelected
                    ? "bg-primary-50 text-primary-900"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    isSelected
                      ? "border-primary-700 bg-primary-700 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Check size={12} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{mode.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                    {mode.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
