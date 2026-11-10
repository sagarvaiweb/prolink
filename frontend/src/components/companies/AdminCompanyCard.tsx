import Link from "next/link";
import { BadgeCheck, Ban, Building2, CircleX, ExternalLink, MapPin, Users } from "lucide-react";
import type { Company } from "@/types/company.types";

interface Props {
  company: Company;
  view: "pending" | "verified";
  isBusy?: boolean;
  onVerify?: () => void;
  onReject?: () => void;
  onSuspend?: () => void;
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date));

export default function AdminCompanyCard({
  company,
  view,
  isBusy = false,
  onVerify,
  onReject,
  onSuspend,
}: Props) {
  const creator =
    typeof company.createdBy === "string" ? null : company.createdBy;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo}
              alt={company.name + " logo"}
              className="h-16 w-16 shrink-0 rounded-2xl border border-slate-100 object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
              <Building2 size={26} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {company.name}
              </h2>
              {view === "verified" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <BadgeCheck size={14} /> Verified
                </span>
              )}
              {view === "pending" && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  Awaiting review
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {company.industry || "Industry not provided"}
              {creator && (
                <>
                  <span aria-hidden="true" className="mx-2">·</span>
                  Submitted by {creator.firstName} {creator.lastName}
                </>
              )}
            </p>
          </div>

          <Link
            href={"/companies/" + company._id}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary-800 transition hover:text-primary-950"
          >
            Review profile <ExternalLink size={15} />
          </Link>
        </div>

        <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600">
          {company.description || "No company description has been provided."}
        </p>

        <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</dt>
            <dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-700">
              <MapPin size={14} className="text-slate-400" />
              {company.location || "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Company size</dt>
            <dd className="mt-1 font-medium text-slate-700">
              {company.companySize ? company.companySize + " employees" : "Not provided"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Followers</dt>
            <dd className="mt-1 inline-flex items-center gap-1.5 font-medium text-slate-700">
              <Users size={14} className="text-slate-400" />
              {company.followerCount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {view === "pending" ? "Submitted" : "Created"}
            </dt>
            <dd className="mt-1 font-medium text-slate-700">{formatDate(company.createdAt)}</dd>
          </div>
        </dl>

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 break-all text-sm font-medium text-primary-800 hover:underline"
          >
            {company.website}<ExternalLink size={14} />
          </a>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          {view === "pending" && (
            <>
              <button type="button" onClick={onReject} disabled={isBusy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"><CircleX size={16} />Reject application</button>
              <button type="button" onClick={onVerify} disabled={isBusy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50"><BadgeCheck size={16} /> Verify company</button>
            </>
          )}
          <button
            type="button"
            onClick={onSuspend}
            disabled={isBusy}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
          >
            <Ban size={16} /> Suspend company
          </button>
        </div>
      </div>
    </article>
  );
}
