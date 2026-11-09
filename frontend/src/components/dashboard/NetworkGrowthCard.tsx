import { Network, UsersRound } from "lucide-react";
import type { NetworkGrowthAnalytics } from "@/types/dashboard.types";

function shortDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function NetworkGrowthCard({
  analytics,
}: {
  analytics: NetworkGrowthAnalytics;
}) {
  const recentSeries = analytics.series.slice(-14);
  const lastDay = recentSeries[recentSeries.length - 1];
  const maxValue = Math.max(
    1,
    ...recentSeries.flatMap((item) => [item.connections, item.followers])
  );

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_50px_-36px_rgba(15,23,42,0.3)] sm:p-7">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold text-slate-500">Your community</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Network growth</h2>
          <p className="mt-1 text-sm text-slate-500">New connections and followers over time</p>
        </div>
        <div className="flex gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Connections</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-950">
              <Network size={17} className="text-indigo-500" />
              {analytics.totals.connections.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Followers</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-bold text-slate-950">
              <UsersRound size={17} className="text-teal-500" />
              {analytics.totals.followers.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {analytics.series.some((item) => item.connections || item.followers) ? (
        <div className="mt-7">
          <div className="flex h-36 items-end gap-1.5 sm:gap-2" role="img" aria-label="Daily connection and follower growth">
            {recentSeries.map((item) => (
              <div key={item.date} className="group flex h-full min-w-0 flex-1 items-end justify-center gap-1 rounded-t-lg px-0.5 hover:bg-slate-50" title={`${shortDate(item.date)} · ${item.connections} connections · ${item.followers} followers`}>
                <span
                  className="w-full max-w-3 rounded-t-md bg-indigo-400 transition-all group-hover:bg-indigo-600"
                  style={{ height: `${Math.max(4, (item.connections / maxValue) * 100)}%` }}
                />
                <span
                  className="w-full max-w-3 rounded-t-md bg-teal-400 transition-all group-hover:bg-teal-600"
                  style={{ height: `${Math.max(4, (item.followers / maxValue) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>{recentSeries[0] ? shortDate(recentSeries[0].date) : ""}</span>
            <span>Recent activity</span>
            <span>{lastDay ? shortDate(lastDay.date) : ""}</span>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />Connections</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-400" />Followers</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
          <UsersRound size={21} className="text-indigo-500" />
          <p className="mt-2 text-sm font-semibold text-slate-800">Keep building your circle</p>
          <p className="mt-1 text-xs text-slate-500">New connections and followers will appear here.</p>
        </div>
      )}
    </section>
  );
}
