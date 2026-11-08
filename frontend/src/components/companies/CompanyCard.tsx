import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Building2, MapPin, Users } from "lucide-react";
import type { Company } from "@/types/company.types";

export default function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md sm:p-6">
      <div className="flex items-start gap-4">
        {company.logo ? <img src={company.logo} alt={`${company.name} logo`} className="h-14 w-14 rounded-2xl border border-slate-100 object-cover" /> : <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-800"><Building2 size={24} /></div>}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold text-slate-900">{company.name}</h2>{company.isVerified && <span title="Verified company" className="text-primary-700"><BadgeCheck size={18} /></span>}</div><p className="mt-1 text-sm text-slate-500">{company.industry || "Industry not specified"}</p></div>
        <Link href={`/companies/${company._id}`} aria-label={`View ${company.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-primary-50 hover:text-primary-800"><ArrowUpRight size={19} /></Link>
      </div>
      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{company.description || "Learn more about this organization and explore its open roles."}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{company.location || "Location not listed"}</span><span className="inline-flex items-center gap-1.5"><Users size={14} />{company.followerCount.toLocaleString()} followers</span></div>
    </article>
  );
}
