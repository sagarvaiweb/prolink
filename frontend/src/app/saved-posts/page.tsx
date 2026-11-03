"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import FeedPostCard from "@/components/posts/FeedPostCard";
import usePostManagement from "@/components/posts/usePostManagement";
import { useGetSavedPostsQuery } from "@/redux/features/posts/postsApi";
import { useAppSelector } from "@/redux/hooks";

const PAGE_SIZE = 10;

export default function SavedPostsPage() {
  const [page, setPage] = useState(1);
  const user = useAppSelector((state) => state.auth.user);
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetSavedPostsQuery({ page, limit: PAGE_SIZE });
  const {
    handleUpdatePost,
    handleDeletePost,
    isUpdating,
    isDeleting,
  } = usePostManagement();
  const savedPage = currentData?.data;

  const onDelete = async (postId: string) => {
    const deleted = await handleDeletePost(postId);
    if (deleted && savedPage?.posts.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
    return deleted;
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/feed"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to feed
          </Link>

          <header className="mb-6 flex items-center gap-4 rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-5 py-6 text-white sm:px-8 sm:py-7">
            <div className="rounded-2xl bg-white/10 p-3">
              <BookmarkCheck size={25} />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-100">
                Keep useful updates close
              </p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Saved posts
              </h1>
              {savedPage && (
                <p className="mt-1 text-sm text-primary-100">
                  {savedPage.pagination.total}{" "}
                  {savedPage.pagination.total === 1 ? "post" : "posts"}
                </p>
              )}
            </div>
          </header>

          <div className="space-y-4">
            {isLoading && (
              <div role="status" aria-busy="true" className="space-y-4">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    aria-hidden="true"
                    className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-4/5 rounded bg-slate-100" />
                  </div>
                ))}
                <span className="sr-only">Loading saved posts...</span>
              </div>
            )}

            {isError && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                Could not load saved posts.
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

            {isFetching && currentData && (
              <p role="status" className="text-center text-sm text-slate-500">
                Updating saved posts...
              </p>
            )}

            {!isLoading && !isError && savedPage?.posts.length === 0 && (
              <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-full bg-primary-50 p-4 text-primary-800">
                  <BookmarkCheck size={25} />
                </div>
                <h2 className="mt-4 font-semibold text-slate-900">
                  Nothing saved yet
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Save posts from your feed to find them here later.
                </p>
                <Link
                  href="/feed"
                  className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                >
                  Explore the feed
                </Link>
              </section>
            )}

            {!isError &&
              savedPage?.posts.map((post) => (
                <FeedPostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id ?? ""}
                  isDeleting={isDeleting}
                  isUpdating={isUpdating}
                  onUpdate={handleUpdatePost}
                  onDelete={onDelete}
                />
              ))}

            {savedPage && savedPage.pagination.totalPages > 1 && (
              <nav
                aria-label="Saved post pages"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
              >
                <p className="text-sm text-slate-500">
                  Page {savedPage.pagination.page} of{" "}
                  {savedPage.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                    disabled={page <= 1 || isFetching}
                    aria-label="Previous saved posts page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    disabled={
                      page >= savedPage.pagination.totalPages || isFetching
                    }
                    aria-label="Next saved posts page"
                    className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
