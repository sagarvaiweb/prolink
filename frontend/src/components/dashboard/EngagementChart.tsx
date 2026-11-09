import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { PostEngagementAnalytics } from "@/types/dashboard.types";

const chartLines = [
  { key: "likes", label: "Likes", color: "#536df2", icon: Heart },
  { key: "comments", label: "Comments", color: "#19a887", icon: MessageCircle },
  { key: "shares", label: "Shares", color: "#f3a643", icon: Repeat2 },
] as const;

type EngagementKey = (typeof chartLines)[number]["key"];

function getPoints(values: number[], max: number) {
  if (values.length === 0) return "";

  const width = 720;
  const height = 190;
  const top = 18;
  const bottom = 164;
  const usableHeight = bottom - top;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = bottom - (value / max) * usableHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function EngagementChart({
  analytics,
}: {
  analytics: PostEngagementAnalytics;
}) {
  const maxValue = Math.max(
    1,
    ...analytics.series.flatMap((item) => [item.likes, item.comments, item.shares])
  );
  const labelIndexes = [0, Math.floor((analytics.series.length - 1) / 3), Math.floor((analytics.series.length - 1) * 2 / 3), analytics.series.length - 1]
    .filter((index, position, indexes) => index >= 0 && indexes.indexOf(index) === position);
  const hasEngagement = analytics.totals.likes + analytics.totals.comments + analytics.totals.shares > 0;

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500">Post performance</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Engagement over time</h2>
          <p className="mt-1 text-sm text-slate-500">Activity on posts you published during this period</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart legend">
          {chartLines.map(({ key, label, color, icon: Icon }) => (
            <span key={key} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <Icon size={14} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {hasEngagement ? (
        <div className="mt-7">
          <div className="relative h-52 w-full">
            <svg
              viewBox="0 0 720 190"
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label="Daily post likes, comments, and shares"
            >
              {[18, 66, 114, 164].map((y) => (
                <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="#e9edf5" strokeDasharray="4 7" />
              ))}
              {chartLines.map(({ key, color }) => (
                <polyline
                  key={key}
                  points={getPoints(analytics.series.map((item) => item[key as EngagementKey]), maxValue)}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
          <div className="mt-3 flex justify-between text-[11px] font-medium text-slate-400">
            {labelIndexes.map((index) => (
              <span key={`${analytics.series[index].date}-${index}`}>
                {formatDate(analytics.series[index].date)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-7 flex min-h-52 flex-col items-center justify-center rounded-2xl bg-slate-50 px-5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Heart size={21} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-800">Your next post starts the trend</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Publish something useful and your likes, comments, and shares will show up here.</p>
        </div>
      )}
    </section>
  );
}
