import Link from "next/link";
import { BadgeCheck, Building2 } from "lucide-react";
import type { JobCompany, JobRecruiter } from "@/types/job.types";

interface Props {
  company?: JobCompany | null;
  recruiter?: JobRecruiter | null;
  showRecruiter?: boolean;
  inverse?: boolean;
}

export default function JobCompanyAttribution({
  company,
  recruiter,
  showRecruiter = false,
  inverse = false,
}: Props) {
  const name = company?.name ??
    (recruiter ? recruiter.firstName + " " + recruiter.lastName : "ProLink employer");
  const avatar = company?.logo ?? recruiter?.avatar;
  const nameClass = (inverse ? "font-semibold text-white hover:text-primary-100" : "font-semibold text-slate-800 hover:text-primary-800");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={"flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl " + (inverse ? "bg-white/10 text-white" : "bg-primary-50 text-primary-800")}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : company ? (
          <Building2 size={19} />
        ) : recruiter ? (
          <span className="text-xs font-bold">{(recruiter.firstName[0] ?? "") + (recruiter.lastName[0] ?? "")}</span>
        ) : (
          <Building2 size={19} />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          {company && !company.isSuspended ? (
            <Link href={"/companies/" + company._id} className={"truncate text-sm " + nameClass}>{name}</Link>
          ) : company ? (
            <span className={"truncate text-sm " + nameClass}>{name}</span>
          ) : recruiter ? (
            <Link href={"/profile/" + recruiter._id} className={"truncate text-sm " + nameClass}>{name}</Link>
          ) : (
            <span className={"truncate text-sm " + nameClass}>{name}</span>
          )}
          {company?.isVerified && <BadgeCheck size={15} className={inverse ? "shrink-0 text-emerald-300" : "shrink-0 text-emerald-700"} aria-label="Verified company" />}
        </div>
        {showRecruiter && company && recruiter && (
          <p className={"mt-0.5 truncate text-xs " + (inverse ? "text-primary-100" : "text-slate-500")}>
            Posted by {recruiter.firstName} {recruiter.lastName}
          </p>
        )}
        {company && !showRecruiter && company.industry && (
          <p className={"mt-0.5 truncate text-xs " + (inverse ? "text-primary-100" : "text-slate-500")}>{company.industry}</p>
        )}
      </div>
    </div>
  );
}
