"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Network,
  RefreshCw,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import NetworkPersonCard from "@/components/network/NetworkPersonCard";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import {
  useGetSuggestionsQuery,
  useSendConnectionRequestMutation,
} from "@/redux/features/network/networkApi";
import type { NetworkPerson } from "@/types/network.types";

const PAGE_SIZE = 12;

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return "Something went wrong. Please try again.";
};

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Suggestion pages"
      className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"
    >
      <p className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-800">{page}</span> of{" "}
        <span className="font-medium text-slate-800">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}

function SuggestionsLoadingState() {
  return (
    <div role="status" aria-label="Loading suggestions" aria-busy="true">
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Finding people for your network...
      </div>
      <div className="space-y-3">
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="h-14 w-14 shrink-0 rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-36 max-w-full rounded bg-slate-100" />
              <div className="h-3 w-24 max-w-full rounded bg-slate-100" />
              <div className="h-3 w-40 max-w-full rounded bg-slate-100" />
            </div>
            <div className="hidden h-10 w-24 shrink-0 rounded-lg bg-slate-100 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuggestionsPage() {
  const [page, setPage] = useState(1);
  const [personToConnect, setPersonToConnect] = useState<NetworkPerson | null>(
    null
  );
  const { currentData, isLoading, isError, isFetching, refetch } =
    useGetSuggestionsQuery({ page, limit: PAGE_SIZE });
  const [sendConnectionRequest, { isLoading: isSendingRequest }] =
    useSendConnectionRequestMutation();

  const suggestions = currentData?.data.suggestions ?? [];
  const pagination = currentData?.data.pagination;
  const isOutOfRange =
    pagination !== undefined &&
    pagination.totalPages > 0 &&
    page > pagination.totalPages;

  const handleConnect = async (personId: string) => {
    try {
      await sendConnectionRequest(personId).unwrap();
      toast.success("Connection request sent.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmConnect = async () => {
    if (!personToConnect) return;
    await handleConnect(personToConnect._id);
    setPersonToConnect(null);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/network"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to my network
          </Link>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-6 py-8 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Network size={26} />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-100">
                    Grow your professional community
                  </p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    People you may know
                  </h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-primary-100">
                Discover people connected to your network. Suggestions with
                more mutual connections appear first.
              </p>
            </header>

            <div className="p-4 sm:p-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Suggested connections
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Find someone new to connect with.
                  </p>
                </div>
                {pagination && (
                  <span className="text-sm text-slate-500">
                    {pagination.total}{" "}
                    {pagination.total === 1 ? "person" : "people"}
                  </span>
                )}
              </div>

              {(isLoading || (isFetching && !currentData)) && (
                <SuggestionsLoadingState />
              )}

              {isError && !isLoading && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                >
                  Could not load suggestions. Please try again.
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="ml-2 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                  >
                    <RefreshCw size={14} />
                    Try again
                  </button>
                </div>
              )}

              {!isLoading && !isError && isOutOfRange && pagination && (
                <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <h3 className="font-semibold text-slate-900">
                    No more suggestions on this page
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPage(pagination.totalPages)}
                    className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                  >
                    Go to the last available page
                  </button>
                </div>
              )}

              {!isLoading &&
                !isError &&
                !isOutOfRange &&
                suggestions.length === 0 && (
                <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="rounded-full bg-white p-4 text-primary-700 shadow-sm">
                    <UsersRound size={25} />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No suggestions yet
                  </h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    Connect with more people and we’ll show you others in their
                    networks.
                  </p>
                  <Link
                    href="/network"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                  >
                    <UserRoundPlus size={16} />
                    View my network
                  </Link>
                </div>
              )}

              {!isError && suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map((person) => (
                    <NetworkPersonCard
                      key={person._id}
                      person={person}
                      description={`${person.mutualConnectionsCount} mutual ${
                        person.mutualConnectionsCount === 1
                          ? "connection"
                          : "connections"
                      }`}
                      actions={
                        <button
                          type="button"
                          disabled={isSendingRequest}
                          onClick={() => setPersonToConnect(person)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <UserRoundPlus size={16} />
                          {isSendingRequest ? "Sending..." : "Connect"}
                        </button>
                      }
                    />
                  ))}
                </div>
              )}

              {pagination && !isOutOfRange && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </section>
        </div>
        <ConfirmationDialog
          isOpen={personToConnect !== null}
          title="Send connection request?"
          description={
            personToConnect
              ? `Send a connection request to ${personToConnect.firstName} ${personToConnect.lastName}?`
              : ""
          }
          confirmLabel="Send request"
          isPending={isSendingRequest}
          onConfirm={confirmConnect}
          onCancel={() => setPersonToConnect(null)}
        />
      </main>
    </ProtectedRoute>
  );
}
