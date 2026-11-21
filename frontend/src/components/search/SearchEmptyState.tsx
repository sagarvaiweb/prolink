import { SearchX } from "lucide-react";

export default function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX size={25} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900">No results found</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        We couldn’t find anything for “{query}”. Try a different phrase or
        search across all categories.
      </p>
    </div>
  );
}
