import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  MapPin,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import type { SearchMode, SearchResult } from "@/types/search.types";

const entityLabels = {
  person: "Person",
  job: "Job",
  post: "Post",
  company: "Company",
};

const entityIcons = {
  person: UserRound,
  job: BriefcaseBusiness,
  post: UserRound,
  company: Building2,
};

const resultHref = (result: SearchResult) => {
  switch (result.entityType) {
    case "person":
      return `/profile/${result.entityId}`;
    case "job":
      return `/jobs/${result.entityId}`;
    case "post":
      return `/posts/${result.entityId}`;
    case "company":
      return `/companies/${result.entityId}`;
  }
};

function Detail({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5">{children}</span>;
}

function ResultMetadata({ result }: { result: SearchResult }) {
  if (result.entityType === "person") {
    return (
      <>
        {result.data.location && (
          <Detail>
            <MapPin size={14} />
            {result.data.location}
          </Detail>
        )}
        <Detail>{result.data.role}</Detail>
      </>
    );
  }

  if (result.entityType === "job") {
    return (
      <>
        <Detail>
          <MapPin size={14} />
          {result.data.location}
        </Detail>
        <Detail>{result.data.employmentType}</Detail>
        {result.data.isRemote && <Detail>Remote</Detail>}
        {result.data.salaryRange && <Detail>{result.data.salaryRange}</Detail>}
      </>
    );
  }

  if (result.entityType === "company") {
    return (
      <>
        {result.data.industry && <Detail>{result.data.industry}</Detail>}
        {result.data.location && (
          <Detail>
            <MapPin size={14} />
            {result.data.location}
          </Detail>
        )}
      </>
    );
  }

  return (
    <Detail>
      @{result.data.author.username} · {result.data.author.role}
    </Detail>
  );
}

function ResultImage({ result }: { result: SearchResult }) {
  let image: string | null | undefined;
  let alt = "";

  if (result.entityType === "person") {
    image = result.data.avatar;
    alt = `${result.title} profile photo`;
  } else if (result.entityType === "job") {
    image = result.data.company?.logo || result.data.postedBy?.avatar;
    alt = result.data.company?.name || result.data.postedBy?.firstName || "Job";
  } else if (result.entityType === "post") {
    image = result.data.author.avatar;
    alt = `${result.title} profile photo`;
  } else {
    image = result.data.logo;
    alt = `${result.title} logo`;
  }

  if (image) {
    return (
      <Image
        src={image}
        alt={alt}
        width={48}
        height={48}
        unoptimized
        className="h-12 w-12 shrink-0 rounded-2xl border border-slate-100 object-cover"
      />
    );
  }

  const Icon = entityIcons[result.entityType];
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-800">
      <Icon size={21} />
    </span>
  );
}

export default function SearchResultCard({
  result,
  rank,
  mode,
}: {
  result: SearchResult;
  rank: number;
  mode: SearchMode;
}) {
  const href = resultHref(result);
  const companyName =
    result.entityType === "job" ? result.data.company?.name : undefined;
  const isVerified =
    (result.entityType === "company" && result.data.isVerified) ||
    (result.entityType === "job" && result.data.company?.isVerified);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        <ResultImage result={result} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {entityLabels[result.entityType]}
            </span>
            {isVerified && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800"
                title="Verified company"
              >
                <BadgeCheck size={15} /> Verified
              </span>
            )}
            {mode === "semantic" && Number.isFinite(result.score) && (
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] text-violet-800"
                title="Vector similarity ranking signal, not a probability or percentage"
              >
                <span className="font-medium text-violet-700">Similarity</span>
                <span className="font-bold tabular-nums">{result.score.toFixed(2)}</span>
              </span>
            )}
            <span
              className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                rank === 1
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                  : "bg-primary-50 text-primary-800"
              }`}
              title={rank === 1 ? "Top search result" : `Search result ${rank}`}
            >
              {rank === 1 && <span>Top match</span>}
              #{rank}
            </span>
          </div>
          <Link
            href={href}
            className="mt-2 block truncate text-lg font-bold text-slate-900 transition hover:text-primary-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {result.title}
          </Link>
          {companyName && (
            <p className="mt-0.5 text-sm font-medium text-slate-600">
              {companyName}
            </p>
          )}
          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {result.description || "No description available."}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
            <ResultMetadata result={result} />
          </div>
          {result.entityType === "person" && result.data.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.data.skills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
          {result.entityType === "job" && result.data.requiredSkills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {result.data.requiredSkills.slice(0, 5).map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
