import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";

interface NetworkingCardSkeletonProps {
  count?: number;
}

export function NetworkingCardSkeleton({ count = 3 }: NetworkingCardSkeletonProps) {
  return (
    <div className="space-y-3" aria-label="Loading networking content" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="h-14 w-14 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

interface NetworkingErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function NetworkingErrorState({ message, onRetry }: NetworkingErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-center text-sm text-red-700" role="alert">
      <AlertCircle className="mx-auto mb-2" size={22} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg px-3 py-1.5 font-semibold text-red-800 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

interface NetworkingEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function NetworkingEmptyState({
  title,
  description,
  action,
}: NetworkingEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto mb-3 inline-flex rounded-xl bg-blue-50 p-3 text-blue-800">
        <Inbox size={22} aria-hidden="true" />
      </span>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
