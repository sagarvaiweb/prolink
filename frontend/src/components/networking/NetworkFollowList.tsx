"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetFollowersQuery, useGetFollowingQuery } from "@/redux/features/networking/networkingApi";
import { setActiveContext } from "@/redux/features/networking/networkingSlice";
import { useAppDispatch } from "@/redux/hooks";
import FollowButton from "./FollowButton";
import NetworkingUserCard from "./NetworkingUserCard";
import {
  NetworkingCardSkeleton,
  NetworkingEmptyState,
  NetworkingErrorState,
} from "./NetworkingStates";
import { getNetworkingErrorMessage } from "./networking.utils";

type FollowListMode = "followers" | "following";

interface NetworkFollowListProps {
  mode: FollowListMode;
}

const PAGE_SIZE = 10;

const content = {
  followers: {
    eyebrow: "Your professional network",
    title: "Followers",
    description: "People who follow your professional journey.",
    emptyTitle: "No followers yet",
    emptyDescription: "Share your professional journey to start growing your audience.",
  },
  following: {
    eyebrow: "Your professional network",
    title: "Following",
    description: "People and professionals you choose to follow.",
    emptyTitle: "You are not following anyone yet",
    emptyDescription: "Follow professionals to keep up with their career updates.",
  },
};

function FollowListContent({ mode }: NetworkFollowListProps) {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const params = { page, limit: PAGE_SIZE };
  const followersQuery = useGetFollowersQuery(params, { skip: mode !== "followers" });
  const followingQuery = useGetFollowingQuery(params, { skip: mode !== "following" });
  const query = mode === "followers" ? followersQuery : followingQuery;
  const labels = content[mode];

  useEffect(() => {
    dispatch(setActiveContext(mode));
  }, [dispatch, mode]);

  const followData = query.data?.data;
  const isInitialLoading = query.isLoading && !followData;

  if (isInitialLoading) {
    return <NetworkingCardSkeleton count={4} />;
  }

  if (query.isError && !followData) {
    return (
      <NetworkingErrorState
        message={getNetworkingErrorMessage(query.error, `Unable to load your ${labels.title.toLowerCase()}.`)}
        onRetry={query.refetch}
      />
    );
  }

  if (!followData || followData.pagination.totalUsers === 0) {
    return (
      <NetworkingEmptyState
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  const { pagination, users } = followData;
  const hasPreviousPage = page > 1;
  const hasNextPage = pagination.currentPage < pagination.totalPages;

  return (
    <div className="space-y-5">
      {query.isError && (
        <NetworkingErrorState
          message={getNetworkingErrorMessage(
            query.error,
            `Unable to refresh this page of ${labels.title.toLowerCase()}.`
          )}
          onRetry={query.refetch}
        />
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <NetworkingUserCard
            key={user._id}
            user={user}
            action={<FollowButton userId={user._id} />}
          />
        ))}
      </div>

      <nav
        aria-label={`${labels.title} pagination`}
        className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <p className="text-sm text-gray-500" aria-live="polite">
          Page {pagination.currentPage} of {pagination.totalPages} &middot;{" "}
          {pagination.totalUsers} {labels.title.toLowerCase()}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={!hasPreviousPage || query.isFetching}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={!hasNextPage || query.isFetching}
            className="rounded-xl bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-900 active:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {query.isFetching ? "Loading..." : "Next"}
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function NetworkFollowList({ mode }: NetworkFollowListProps) {
  const labels = content[mode];

  return (
    <ProtectedRoute>
      <main className="min-h-full bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6">
            <p className="mb-2 text-sm font-semibold text-blue-800">{labels.eyebrow}</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {labels.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              {labels.description}
            </p>
          </header>
          <FollowListContent mode={mode} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
