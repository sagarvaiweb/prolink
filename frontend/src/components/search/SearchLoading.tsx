import { LoaderCircle } from "lucide-react";

export default function SearchLoading() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <span className="sr-only">Loading search results</span>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-20 rounded bg-slate-100" />
              <div className="h-5 w-2/3 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
      <p className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={17} />
        Searching ProLink...
      </p>
    </div>
  );
}
