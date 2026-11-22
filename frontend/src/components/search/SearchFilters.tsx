"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type {
  SearchCategory,
  SearchFilters as SearchFilterValues,
} from "@/types/search.types";

const roles = [
  { value: "student", label: "Student" },
  { value: "professional", label: "Professional" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
];

const experienceLevels = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior level" },
];

const employmentTypes = [
  { value: "full-time", label: "Full time" },
  { value: "part-time", label: "Part time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
];

const fieldClassName =
  "mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";

function FilterField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function supportedFields(category: SearchCategory) {
  if (category === "all") return ["location", "skills", "industry"];
  if (category === "people") return ["location", "skills", "role", "title"];
  if (category === "jobs") {
    return [
      "location",
      "skills",
      "experienceLevel",
      "employmentType",
      "salaryRange",
      "industry",
    ];
  }
  if (category === "posts") return ["author", "dateFrom", "dateTo"];
  return ["location", "industry"];
}

function validateFilters(
  values: SearchFilterValues,
  category: SearchCategory
) {
  if (category === "posts" && values.author && !/^[a-f\d]{24}$/i.test(values.author)) {
    return "Enter a valid 24-character author user ID, or leave it blank.";
  }

  const skills = values.skills
    ?.split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  if (skills && (skills.length > 20 || skills.some((skill) => skill.length > 50))) {
    return "Enter up to 20 skills, with no skill longer than 50 characters.";
  }

  if (
    values.dateFrom &&
    values.dateTo &&
    new Date(values.dateFrom).getTime() > new Date(values.dateTo).getTime()
  ) {
    return "The start date must be on or before the end date.";
  }

  return "";
}

export default function SearchFilters({
  category,
  filters,
  onApply,
}: {
  category: SearchCategory;
  filters: SearchFilterValues;
  onApply: (filters: SearchFilterValues) => void;
}) {
  const [values, setValues] = useState<SearchFilterValues>(filters);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(() =>
    Object.values(filters).some(Boolean)
  );
  const visibleFields = supportedFields(category);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const hasValues = Object.values(values).some(Boolean);
  const updateValue = (key: keyof SearchFilterValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value || undefined }));
    setError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFilters(values, category);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextFilters = Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        .filter(([, value]) => Boolean(value))
    ) as SearchFilterValues;

    setError("");
    onApply(nextFilters);
  };

  const handleClear = () => {
    setValues({});
    setError("");
    onApply({});
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="search-filter-form"
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between px-4 py-4 text-left lg:hidden"
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <SlidersHorizontal size={17} className="text-primary-800" />
          Refine results
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] text-primary-900">
              {activeFilterCount}
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-primary-800">
          {isOpen ? "Hide" : "Show"}
        </span>
      </button>

      <form
        id="search-filter-form"
        onSubmit={handleSubmit}
        className={`${isOpen ? "block" : "hidden"} border-t border-slate-100 p-4 lg:block lg:border-0 lg:p-5`}
      >
        <div className="hidden items-center gap-2 lg:flex">
          <SlidersHorizontal size={17} className="text-primary-800" />
          <h2 className="text-sm font-bold text-slate-900">Refine results</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {category === "all"
            ? "Location, skills, and industry filter the categories that support them."
            : "Choose values to narrow this category."}
        </p>

        <div className="mt-4 space-y-4">
          {visibleFields.includes("location") && (
            <FilterField id="search-filter-location" label="Location">
              <input
                id="search-filter-location"
                type="text"
                maxLength={150}
                value={values.location || ""}
                onChange={(event) => updateValue("location", event.target.value)}
                placeholder="City or region"
                className={fieldClassName}
              />
            </FilterField>
          )}

          {visibleFields.includes("skills") && (
            <FilterField id="search-filter-skills" label="Skills">
              <input
                id="search-filter-skills"
                type="text"
                maxLength={1000}
                value={values.skills || ""}
                onChange={(event) => updateValue("skills", event.target.value)}
                placeholder="React, TypeScript"
                className={fieldClassName}
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Separate skills with commas. Results must match your search
                phrase and at least one listed skill on a profile or job.
              </span>
            </FilterField>
          )}

          {visibleFields.includes("role") && (
            <FilterField id="search-filter-role" label="Account type">
              <select
                id="search-filter-role"
                value={values.role || ""}
                onChange={(event) => updateValue("role", event.target.value)}
                className={fieldClassName}
              >
                <option value="">Any account type</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {visibleFields.includes("title") && (
            <FilterField id="search-filter-title" label="Headline or title">
              <input
                id="search-filter-title"
                type="text"
                maxLength={120}
                value={values.title || ""}
                onChange={(event) => updateValue("title", event.target.value)}
                placeholder="Designer, engineer..."
                className={fieldClassName}
              />
            </FilterField>
          )}

          {visibleFields.includes("experienceLevel") && (
            <FilterField id="search-filter-experience" label="Experience level">
              <select
                id="search-filter-experience"
                value={values.experienceLevel || ""}
                onChange={(event) => updateValue("experienceLevel", event.target.value)}
                className={fieldClassName}
              >
                <option value="">Any experience</option>
                {experienceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {visibleFields.includes("employmentType") && (
            <FilterField id="search-filter-employment" label="Employment type">
              <select
                id="search-filter-employment"
                value={values.employmentType || ""}
                onChange={(event) => updateValue("employmentType", event.target.value)}
                className={fieldClassName}
              >
                <option value="">Any employment type</option>
                {employmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FilterField>
          )}

          {visibleFields.includes("salaryRange") && (
            <FilterField id="search-filter-salary" label="Salary range">
              <input
                id="search-filter-salary"
                type="text"
                maxLength={100}
                value={values.salaryRange || ""}
                onChange={(event) => updateValue("salaryRange", event.target.value)}
                placeholder="Use the exact listed range"
                className={fieldClassName}
              />
            </FilterField>
          )}

          {visibleFields.includes("industry") && (
            <FilterField id="search-filter-industry" label="Industry">
              <input
                id="search-filter-industry"
                type="text"
                maxLength={100}
                value={values.industry || ""}
                onChange={(event) => updateValue("industry", event.target.value)}
                placeholder="Technology, healthcare..."
                className={fieldClassName}
              />
            </FilterField>
          )}

          {visibleFields.includes("author") && (
            <FilterField id="search-filter-author" label="Author user ID">
              <input
                id="search-filter-author"
                type="text"
                maxLength={24}
                value={values.author || ""}
                onChange={(event) => updateValue("author", event.target.value.trim())}
                placeholder="24-character ID"
                className={fieldClassName}
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Optional. Use the author’s profile ID.
              </span>
            </FilterField>
          )}

          {visibleFields.includes("dateFrom") && (
            <FilterField id="search-filter-date-from" label="Posted from">
              <input
                id="search-filter-date-from"
                type="date"
                max={values.dateTo}
                value={values.dateFrom || ""}
                onChange={(event) => updateValue("dateFrom", event.target.value)}
                className={fieldClassName}
              />
            </FilterField>
          )}

          {visibleFields.includes("dateTo") && (
            <FilterField id="search-filter-date-to" label="Posted through">
              <input
                id="search-filter-date-to"
                type="date"
                min={values.dateFrom}
                value={values.dateTo || ""}
                onChange={(event) => updateValue("dateTo", event.target.value)}
                className={fieldClassName}
              />
            </FilterField>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs leading-5 text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary-900 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search filters"
            disabled={!hasValues}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-600 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </form>
    </section>
  );
}
