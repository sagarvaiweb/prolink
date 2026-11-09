import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness } from "lucide-react";
import type { ApplicationsSummary } from "@/types/dashboard.types";

const statusRows = [
  { key: "applied", label: "In review", color: "bg-indigo-500" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-cyan-500" },
  { key: "hired", label: "Offers", color: "bg-emerald-500" },
  { key: "rejected", label: "Closed", color: "bg-slate-300" },
] as const;

export default function ApplicationsStatusCard({
  summary,
}: {
  summary: ApplicationsSummary;
}) {
  const total = summary.total;
  let currentStop = 0;
  const stops = statusRows.map(({ key }, index) => {
    const start = currentStop;
    currentStop += total ? (summary.byStatus[key] / total) * 100 : 0;
    return `${["#6366f1", "#06b6d4", "#10b981", "#cbd5e1"][index]} ${start}% ${currentStop}%`;
  });
  const donutStyle = {
    background: total
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)",
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">Job search</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Applications</h2>
        </div>
        <Link href="/applications" className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-indigo-600" aria-label="View applications">
          <ArrowUpRight size={19} />
        </Link>
      </div>

      {total ? (
        <>
          <div className="mt-6 flex items-center gap-5">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={donutStyle}>
              <div className="grid h-[82px] w-[82px] place-items-center rounded-full bg-white">
                <div className="text-center">
                  <p className="text-2xl font-bold leading-none text-slate-950">{total}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">total</p>
                </div>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {statusRows.map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2 text-slate-500">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="font-bold tabular-nums text-slate-800">{summary.byStatus[key]}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/applications" className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
            Track applications <ArrowUpRight size={16} />
          </Link>
        </>
      ) : (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-slate-50 px-5 py-7 text-center">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <BriefcaseBusiness size={19} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">Your next opportunity is out there</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Save roles and keep track of your applications in one place.</p>
          <Link href="/jobs" className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700">Explore open roles</Link>
        </div>
      )}
    </section>
  );
}
