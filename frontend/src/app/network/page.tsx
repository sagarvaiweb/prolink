"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import NetworkingUserCard from "@/components/networking/NetworkingUserCard";
import {
  NetworkingCardSkeleton,
  NetworkingEmptyState,
  NetworkingErrorState,
} from "@/components/networking/NetworkingStates";
import { getNetworkingErrorMessage } from "@/components/networking/networking.utils";
import { useGetConnectionsQuery } from "@/redux/features/networking/networkingApi";
import { setActiveContext } from "@/redux/features/networking/networkingSlice";
import { useAppDispatch } from "@/redux/hooks";

const PAGE_SIZE = 10;

function MyNetworkContent() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const { data, error, isError, isFetching, isLoading, refetch } =
    useGetConnectionsQuery({ page, limit: PAGE_SIZE });

  useEffect(() => {
    dispatch(setActiveContext("connections"));
  }, [dispatch]);

  const connectionData = data?.data;
  const isInitialLoading = isLoading && !connectionData;

  if (isInitialLoading) {
    return <NetworkingCardSkeleton count={4} />;
  }

  if (isError && !connectionData) {
    return (
      <NetworkingErrorState
        message={getNetworkingErrorMessage(error, "Unable to load your connections.")}
        onRetry={refetch}
      />
    );
  }

  if (!connectionData || connectionData.pagination.totalConnections === 0) {
    return (
      <NetworkingEmptyState
        title="No connections yet"
        description="Build your professional network by connecting with people you know."
      />
    );
  }

  const pagination = connectionData.pagination;
  const hasPreviousPage = page > 1;
  const hasNextPage = pagination.currentPage < pagination.totalPages;

  return (
    <div className="space-y-5">
      {isError && (
        <NetworkingErrorState
          message={getNetworkingErrorMessage(
            error,
            "Unable to refresh this page of connections."
          )}
          onRetry={refetch}
        />
      )}

      <div className="grid gap-3">
        {connectionData.connections.map(
          (connection) =>
            connection.user && (
              <NetworkingUserCard
                key={connection._id}
                user={connection.user}
                connectionId={connection._id}
                connectionStatus="accepted"
              />
            )
        )}
      </div>

      <nav
        aria-label="Connections pagination"
        className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <p className="text-sm text-gray-500" aria-live="polite">
          Page {pagination.currentPage} of {pagination.totalPages} &middot;{" "}
          {pagination.totalConnections} connections
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            disabled={!hasPreviousPage || isFetching}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((currentPage) => currentPage + 1)}
            disabled={!hasNextPage || isFetching}
            className="rounded-xl bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-900 active:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetching ? "Loading..." : "Next"}
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function MyNetworkPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-full bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6">
            <p className="mb-2 text-sm font-semibold text-blue-800">Your professional network</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              My Network
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Stay connected with the professionals in your network.
            </p>
          </header>
          <MyNetworkContent />
        </div>
      </main>
    </ProtectedRoute>
  );
}
