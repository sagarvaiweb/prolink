"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import NetworkPersonCard from "@/components/network/NetworkPersonCard";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from "@/redux/features/network/networkApi";

const PAGE_SIZE = 12;

interface Props {
  userId: string;
  listType: "followers" | "following";
}

export default function ProfileFollowListPage({ userId, listType }: Props) {
  const [page, setPage] = useState(1);
  const params = { userId, page, limit: PAGE_SIZE };
  const followersQuery = useGetFollowersQuery(params, {
    skip: listType !== "followers",
  });
  const followingQuery = useGetFollowingQuery(params, {
    skip: listType !== "following",
  });
  const query = listType === "followers" ? followersQuery : followingQuery;
  const users = query.currentData?.data.users ?? [];
  const pagination = query.currentData?.data.pagination;
  const isLoadingPage =
    query.isLoading || (query.isFetching && !query.currentData);
  const isOutOfRange =
    pagination !== undefined &&
    pagination.total > 0 &&
    page > pagination.totalPages;

  const title = listType === "followers" ? "Followers" : "Following";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/profile/${userId}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to profile
          </Link>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {listType === "followers"
                    ? "People who follow this profile."
                    : "People this profile follows."}
                </p>
              </div>
              {pagination && (
                <span className="text-sm text-slate-500">
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "person" : "people"}
                </span>
              )}
            </header>

            {isLoadingPage && (
              <div
                role="status"
                className="flex min-h-52 items-center justify-center gap-3 text-sm text-slate-500"
              >
                <LoaderCircle className="animate-spin" size={20} />
                Loading {title.toLowerCase()}...
              </div>
            )}

            {query.isError && !query.isFetching && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                Could not load this list.{" "}
                <button
                  type="button"
                  onClick={() => void query.refetch()}
                  className="font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoadingPage && !query.isError && isOutOfRange && pagination && (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <h2 className="font-semibold text-slate-900">
                  This page is no longer available
                </h2>
                <button
                  type="button"
                  onClick={() => setPage(pagination.totalPages)}
                  className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                >
                  Go to the last available page
                </button>
              </div>
            )}

            {!isLoadingPage &&
              !query.isError &&
              !isOutOfRange &&
              users.length === 0 && (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                <h2 className="font-semibold text-slate-900">
                  No {listType} yet
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {listType === "followers"
                    ? "Followers will appear here."
                    : "People followed by this profile will appear here."}
                </p>
              </div>
            )}

            {!query.isError && !isOutOfRange && users.length > 0 && (
              <div className="space-y-3">
                {users.map((person) => (
                  <NetworkPersonCard
                    key={person._id}
                    person={person}
                    description={
                      listType === "followers"
                        ? "Follows this profile"
                        : `Following since ${new Date(person.followedAt).toLocaleDateString()}`
                    }
                  />
                ))}
              </div>
            )}

            {pagination &&
              !isOutOfRange &&
              pagination.totalPages > 1 && (
              <nav
                aria-label={`${title} pages`}
                className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"
              >
                <p className="text-sm text-slate-500">
                  Page <span className="font-medium text-slate-800">{page}</span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-800">
                    {pagination.totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={page >= pagination.totalPages}
                    aria-label="Next page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
