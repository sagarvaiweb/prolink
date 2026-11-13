"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { SearchFilters as SearchFilterValues, SearchType } from "@/types/search.types";

const roles = ["student", "professional", "recruiter"] as const;
const jobTypes = ["full-time", "part-time", "internship", "contract"] as const;
const experienceLevels = ["entry", "mid", "senior"] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

const selectClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-50";
const inputClass = "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-50";

export default function SearchFilters({
  type,
  filters,
  onApply,
}: {
  type: SearchType;
  filters: SearchFilterValues;
  onApply: (filters: SearchFilterValues) => void;
}) {
  const [draft, setDraft] = useState<SearchFilterValues>(filters);

  useEffect(() => setDraft(filters), [filters]);

  const update = (key: keyof SearchFilterValues, value: string) => {
    setDraft((current) => ({ ...current, [key]: value || undefined }));
  };
  const activeCount = Object.values(filters).filter(Boolean).length;
  const showPeople = type === "all" || type === "people";
  const showJobs = type === "all" || type === "jobs";
  const showCompanies = type === "all" || type === "companies";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(Object.fromEntries(Object.entries(draft).filter(([, value]) => Boolean(value))) as SearchFilterValues);
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-50 text-primary-700"><SlidersHorizontal size={17} /></span>
          <div><h2 className="text-sm font-bold text-slate-900">Refine results</h2><p className="text-xs text-slate-500">{activeCount ? `${activeCount} filter${activeCount === 1 ? "" : "s"} applied` : "Narrow your search"}</p></div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && <button type="button" onClick={() => { setDraft({}); onApply({}); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><RotateCcw size={13} />Clear filters</button>}
          <button type="submit" className="h-9 rounded-lg bg-primary-800 px-4 text-xs font-bold text-white transition hover:bg-primary-900">Apply filters</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {showPeople && <Field label="Member role"><select className={selectClass} value={draft.role ?? ""} onChange={(event) => update("role", event.target.value)}><option value="">Any role</option>{roles.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}</select></Field>}
        {(showPeople || showJobs) && <Field label="Location"><input className={inputClass} value={draft.location ?? ""} onChange={(event) => update("location", event.target.value)} maxLength={120} placeholder="City or region" /></Field>}
        {showJobs && <Field label="Job type"><select className={selectClass} value={draft.jobType ?? ""} onChange={(event) => update("jobType", event.target.value)}><option value="">Any job type</option>{jobTypes.map((value) => <option key={value} value={value}>{value.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></Field>}
        {showJobs && <Field label="Experience"><select className={selectClass} value={draft.experienceLevel ?? ""} onChange={(event) => update("experienceLevel", event.target.value)}><option value="">Any experience</option>{experienceLevels.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></Field>}
        {showCompanies && <Field label="Industry"><input className={inputClass} value={draft.industry ?? ""} onChange={(event) => update("industry", event.target.value)} maxLength={100} placeholder="e.g. Technology" /></Field>}
      </div>
      {type === "all" && <p className="mt-3 text-[11px] text-slate-400">Each filter applies to the result categories that support it.</p>}
    </form>
  );
}
