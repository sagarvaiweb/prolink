import SearchResultCard from "@/components/search/SearchResultCard";
import type { SearchResult } from "@/types/search.types";

export default function SearchResults({ results }: { results: SearchResult[] }) {
  return (
    <div className="space-y-4">
      {results.map((result) => (
        <SearchResultCard
          key={`${result.entityType}:${result.entityId}`}
          result={result}
        />
      ))}
    </div>
  );
}
