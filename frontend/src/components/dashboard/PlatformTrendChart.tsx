import { useState } from "react";
import type { AdminPlatformStats } from "@/types/dashboard.types";

const metrics = [
  { key: "totalUsers", label: "Total users", color: "#586cf2" },
  { key: "newUsers", label: "New users", color: "#10a886" },
  { key: "totalPosts", label: "Total posts", color: "#f2a53d" },
  { key: "totalJobs", label: "Total jobs", color: "#d76bd1" },
  { key: "activeUsers", label: "Active users", color: "#22a6c7" },
] as const;

type MetricKey = (typeof metrics)[number]["key"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function PlatformTrendChart({
  stats,
}: {
  stats: AdminPlatformStats;
}) {
  const [metric, setMetric] = useState<MetricKey>("totalUsers");
  const selectedMetric = metrics.find((item) => item.key === metric)!;
  const values = stats.series.map((item) => item[metric]);
  const maxValue = Math.max(1, ...values);
  const width = 720;
  const top = 20;
  const bottom = 164;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = bottom - (value / maxValue) * (bottom - top);
      return `${x},${y}`;
    })
    .join(" ");
  const labelIndexes = [
    0,
    Math.floor((stats.series.length - 1) / 2),
    stats.series.length - 1,
  ].filter((index, position, indexes) => index >= 0 && indexes.indexOf(index) === position);

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500">Platform growth</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">A clearer view of progress</h2>
          <p className="mt-1 text-sm text-slate-500">Daily snapshots across your selected date range</p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-slate-100 p-1" role="group" aria-label="Select platform trend">
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMetric(item.key)}
              aria-pressed={metric === item.key}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${metric === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {stats.series.length ? (
        <div className="mt-7">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-2xl font-bold tabular-nums text-slate-950">{Math.max(...values).toLocaleString()}</p>
            <p className="text-xs font-semibold text-slate-400">{selectedMetric.label}</p>
          </div>
          <div className="h-52 w-full">
            <svg
              viewBox="0 0 720 190"
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label={`${selectedMetric.label} daily trend`}
            >
              <defs>
                <linearGradient id="platformTrendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={selectedMetric.color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={selectedMetric.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 68, 116, 164].map((y) => (
                <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="#e9edf5" strokeDasharray="4 7" />
              ))}
              {values.length > 1 && (
                <polygon points={`0,164 ${points} 720,164`} fill="url(#platformTrendFill)" />
              )}
              <polyline
                points={points}
                fill="none"
                stroke={selectedMetric.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {values.length === 1 && (
                <circle cx="360" cy={bottom - (values[0] / maxValue) * (bottom - top)} r="5" fill={selectedMetric.color} />
              )}
            </svg>
          </div>
          <div className="mt-3 flex justify-between text-[11px] font-medium text-slate-400">
            {labelIndexes.map((index) => (
              <span key={`${stats.series[index].date}-${index}`}>{formatDate(stats.series[index].date)}</span>
            ))}
          </div>
          {stats.series.length === 1 && (
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              This is the first saved snapshot in this range. Daily trend points will build as new snapshots are collected.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-7 flex min-h-52 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
          <p className="text-sm font-semibold text-slate-800">No snapshots in this period yet</p>
          <p className="mt-1 text-xs text-slate-500">Choose a wider range to view more platform history.</p>
        </div>
      )}
    </section>
  );
}
