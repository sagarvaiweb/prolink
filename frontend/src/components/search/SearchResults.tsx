import SearchResultCard from "@/components/search/SearchResultCard";
import type { SearchMode, SearchResult } from "@/types/search.types";

export default function SearchResults({
  results,
  startRank = 1,
  mode,
}: {
  results: SearchResult[];
  startRank?: number;
  mode: SearchMode;
}) {
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <SearchResultCard
          key={`${result.entityType}:${result.entityId}`}
          result={result}
          rank={startRank + index}
          mode={mode}
        />
      ))}
    </div>
  );
}
