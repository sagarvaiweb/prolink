"use client";

import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { BriefcaseBusiness, MapPin, Plus, X } from "lucide-react";
import type {
  ExperienceLevel,
  Job,
  JobPayload,
  JobType,
} from "@/types/job.types";

const inputClassName =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";

const textAreaClassName =
  "mt-1.5 min-h-36 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:ring-4 focus:ring-primary-100";

interface JobFormProps {
  initialJob?: Job;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (payload: JobPayload) => Promise<void>;
}

export default function JobForm({
  initialJob,
  isSubmitting,
  submitLabel,
  onSubmit,
}: JobFormProps) {
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [description, setDescription] = useState(initialJob?.description ?? "");
  const [skills, setSkills] = useState(initialJob?.requiredSkills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialJob?.experienceLevel ?? "entry"
  );
  const [jobType, setJobType] = useState<JobType>(
    initialJob?.jobType ?? "full-time"
  );
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [isRemote, setIsRemote] = useState(initialJob?.isRemote ?? false);
  const [salaryRange, setSalaryRange] = useState(initialJob?.salaryRange ?? "");
  const [formError, setFormError] = useState("");

  const addSkill = (value = skillInput) => {
    const skill = value.trim();
    if (
      !skill ||
      skill.length > 50 ||
      skills.some((existing) => existing.toLocaleLowerCase() === skill.toLocaleLowerCase())
    ) {
      return;
    }
    if (skills.length >= 20) {
      setFormError("Add no more than 20 required skills.");
      return;
    }
    setSkills((current) => [...current, skill]);
    setSkillInput("");
    setFormError("");
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (skills.length === 0) {
      setFormError("Add at least one required skill.");
      return;
    }
    if (skills.length > 20) {
      setFormError("Add no more than 20 required skills.");
      return;
    }

    setFormError("");
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      requiredSkills: skills,
      experienceLevel,
      jobType,
      location: location.trim(),
      isRemote,
      salaryRange: salaryRange.trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
          <span className="rounded-xl bg-primary-50 p-2.5 text-primary-800">
            <BriefcaseBusiness size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Role details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Give candidates a clear picture of the position.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Job title</span>
            <input
              required
              minLength={2}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product Designer"
              className={inputClassName}
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">Job type</span>
            <select
              value={jobType}
              onChange={(event) => setJobType(event.target.value as JobType)}
              className={inputClassName}
            >
              <option value="full-time">Full time</option>
              <option value="part-time">Part time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">Experience level</span>
            <select
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value as ExperienceLevel)}
              className={inputClassName}
            >
              <option value="entry">Entry level</option>
              <option value="mid">Mid level</option>
              <option value="senior">Senior level</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">Location</span>
            <span className="relative mt-1.5 block">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                maxLength={120}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="e.g. Kathmandu, Nepal"
                className={`${inputClassName} mt-0 pl-10`}
              />
            </span>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">Salary range</span>
            <input
              maxLength={100}
              value={salaryRange}
              onChange={(event) => setSalaryRange(event.target.value)}
              placeholder="Optional, e.g. NPR 80k–120k/month"
              className={inputClassName}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Job description</span>
            <textarea
              required
              maxLength={20000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the role, responsibilities, and what a successful candidate will bring."
              className={textAreaClassName}
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {description.length}/20,000
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="border-b border-slate-100 pb-5">
          <h2 className="font-semibold text-slate-900">Required skills</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add up to 20 skills. These help candidates assess fit and power the current skills match score.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <input
            value={skillInput}
            maxLength={50}
            onChange={(event) => setSkillInput(event.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type a skill and press Enter"
            aria-label="Add a required skill"
            className={inputClassName.replace("mt-1.5 ", "")}
          />
          <button
            type="button"
            onClick={() => addSkill()}
            disabled={!skillInput.trim()}
            className="mt-0 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        {skills.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Required skills">
            {skills.map((skill) => (
              <li
                key={skill}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 py-1.5 pl-3 pr-1.5 text-sm font-medium text-primary-800"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills((current) => current.filter((item) => item !== skill))}
                  aria-label={`Remove ${skill}`}
                  className="rounded p-1 transition hover:bg-primary-100"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No skills added yet.</p>
        )}

        {formError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">
            {formError}
          </p>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={isRemote}
            onChange={(event) => setIsRemote(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-800"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Remote-friendly role</span>
            <span className="mt-0.5 block text-xs leading-5 text-slate-500">
              Let candidates know they can work remotely.
            </span>
          </span>
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-800 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
