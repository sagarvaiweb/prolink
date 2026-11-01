"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Network,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import NetworkPersonCard from "@/components/network/NetworkPersonCard";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import {
  useAcceptConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useGetMyConnectionsQuery,
  useGetPendingRequestsQuery,
  useGetSentRequestsQuery,
  useRejectConnectionRequestMutation,
  useRemoveConnectionMutation,
} from "@/redux/features/network/networkApi";
import { useAppSelector } from "@/redux/hooks";
import type {
  ConnectionPage,
  ConnectionRecord,
  NetworkPerson,
} from "@/types/network.types";

const PAGE_SIZE = 10;

type NetworkTab = "connections" | "pending" | "sent";

const tabs: { id: NetworkTab; label: string; icon: typeof UsersRound }[] = [
  { id: "connections", label: "Connections", icon: UsersRound },
  { id: "pending", label: "Requests", icon: UserRoundPlus },
  { id: "sent", label: "Sent", icon: Network },
];

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

const getOtherPerson = (
  connection: ConnectionRecord,
  currentUserId: string
): NetworkPerson =>
  connection.requester._id === currentUserId
    ? connection.recipient
    : connection.requester;

function PaginationControls({
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
    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
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
    </div>
  );
}

export default function NetworkPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<NetworkTab>("connections");
  const [page, setPage] = useState(1);
  const params = { page, limit: PAGE_SIZE };

  const connectionsQuery = useGetMyConnectionsQuery(params, {
    skip: activeTab !== "connections",
  });
  const pendingQuery = useGetPendingRequestsQuery(params, {
    skip: activeTab !== "pending",
  });
  const sentQuery = useGetSentRequestsQuery(params, {
    skip: activeTab !== "sent",
  });

  const [acceptRequest, { isLoading: isAccepting }] =
    useAcceptConnectionRequestMutation();
  const [rejectRequest, { isLoading: isRejecting }] =
    useRejectConnectionRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] =
    useCancelConnectionRequestMutation();
  const [removeConnection, { isLoading: isRemoving }] =
    useRemoveConnectionMutation();

  const activeQuery =
    activeTab === "connections"
      ? connectionsQuery
      : activeTab === "pending"
        ? pendingQuery
        : sentQuery;
  const pageData = activeQuery.data?.data as ConnectionPage | undefined;
  const connections = pageData?.connections ?? [];
  const pagination = pageData?.pagination;
  const isActionPending =
    isAccepting || isRejecting || isCancelling || isRemoving;

  const selectTab = (tab: NetworkTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    if (!window.confirm("Remove this connection?")) return;
    void runAction(
      () => removeConnection(connectionId).unwrap(),
      "Connection removed."
    );
  };

  const loading = activeQuery.isLoading;
  const failed = activeQuery.isError;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-6 py-8 text-white sm:px-8">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Network size={26} />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-100">
                    Your professional community
                  </p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    My Network
                  </h1>
                </div>
              </div>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-primary-100">
                Manage your connections and respond to invitations from your
                community.
              </p>
            </header>

            <div className="border-b border-slate-200 px-4 sm:px-8">
              <nav
                aria-label="Network sections"
                className="-mb-px flex gap-5 overflow-x-auto sm:gap-8"
              >
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTab(id)}
                    aria-current={activeTab === id ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-semibold transition ${
                      activeTab === id
                        ? "border-primary-700 text-primary-800"
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                    {activeTab === id && pagination && (
                      <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-800">
                        {pagination.total}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 sm:p-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {activeTab === "connections"
                      ? "Your connections"
                      : activeTab === "pending"
                        ? "Received requests"
                        : "Requests you sent"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeTab === "connections"
                      ? "People you are connected with."
                      : activeTab === "pending"
                        ? "Accept or decline invitations to connect."
                        : "Review invitations that are awaiting a response."}
                  </p>
                </div>
                {pagination && (
                  <span className="text-sm text-slate-500">
                    {pagination.total}{" "}
                    {activeTab === "connections" ? "connections" : "requests"}
                  </span>
                )}
              </div>

              {loading && (
                <div
                  role="status"
                  className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500"
                >
                  <LoaderCircle className="animate-spin" size={20} />
                  Loading your network...
                </div>
              )}

              {failed && !loading && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                >
                  Could not load this list. Please refresh or try again.
                  <button
                    type="button"
                    onClick={() => void activeQuery.refetch()}
                    className="ml-2 font-semibold underline underline-offset-2"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !failed && connections.length === 0 && (
                <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <div className="rounded-full bg-white p-4 text-primary-700 shadow-sm">
                    <UsersRound size={25} />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    {activeTab === "connections"
                      ? "Your network starts here"
                      : activeTab === "pending"
                        ? "No requests right now"
                        : "No sent requests"}
                  </h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                    {activeTab === "connections"
                      ? "Connect with people to grow your professional community."
                      : activeTab === "pending"
                        ? "New connection invitations will appear here."
                        : "Connection requests you send will show up here."}
                  </p>
                  {activeTab === "connections" && (
                    <Link
                      href="/network/suggestions"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                    >
                      <UserRoundPlus size={16} />
                      Find people
                    </Link>
                  )}
                </div>
              )}

              {!loading && !failed && connections.length > 0 && (
                <div className="space-y-3">
                  {connections.map((connection) => {
                    if (!user) return null;
                    const person = getOtherPerson(connection, user._id);

                    if (activeTab === "pending") {
                      return (
                        <NetworkPersonCard
                          key={connection._id}
                          person={connection.requester}
                          description={`Invited you · ${new Date(connection.createdAt).toLocaleDateString()}`}
                          actions={
                            <>
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() =>
                                  void runAction(
                                    () => acceptRequest(connection._id).unwrap(),
                                    "Connection accepted."
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:opacity-50"
                              >
                                <Check size={16} />
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={isActionPending}
                                onClick={() =>
                                  void runAction(
                                    () => rejectRequest(connection._id).unwrap(),
                                    "Request declined."
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                <X size={16} />
                                Decline
                              </button>
                            </>
                          }
                        />
                      );
                    }

                    if (activeTab === "sent") {
                      return (
                        <NetworkPersonCard
                          key={connection._id}
                          person={person}
                          description={`Request sent · ${new Date(connection.createdAt).toLocaleDateString()}`}
                          actions={
                            <button
                              type="button"
                              disabled={isActionPending}
                              onClick={() =>
                                void runAction(
                                  () => cancelRequest(connection._id).unwrap(),
                                  "Request cancelled."
                                )
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel request
                            </button>
                          }
                        />
                      );
                    }

                    return (
                      <NetworkPersonCard
                        key={connection._id}
                        person={person}
                        description="You are connected"
                        actions={
                          <button
                            type="button"
                            disabled={isActionPending}
                            onClick={() =>
                              handleRemoveConnection(connection._id)
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            Remove connection
                          </button>
                        }
                      />
                    );
                  })}
                </div>
              )}

              {!loading && !failed && pagination && (
                <PaginationControls
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
