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
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import FeedPostCard from "@/components/posts/FeedPostCard";
import PostComposer from "@/components/posts/PostComposer";
import {
  useCreatePostMutation,
  useGetFeedQuery,
} from "@/redux/features/posts/postsApi";
import { useAppSelector } from "@/redux/hooks";
import usePostManagement from "@/components/posts/usePostManagement";
import { getPostErrorMessage } from "@/components/posts/postErrors";

const PAGE_SIZE = 10;

function FeedPagination({
  page,
  totalPages,
  isFetching,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Feed pages"
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
    >
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-800">{page}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label="Previous feed page"
          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="Next feed page"
          className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}

function FeedLoadingState() {
  return (
    <div role="status" aria-busy="true" className="space-y-4">
      <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
        <LoaderCircle className="animate-spin" size={18} />
        Loading your feed...
      </div>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-36 rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-4/5 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const [composerVersion, setComposerVersion] = useState(0);
  const user = useAppSelector((state) => state.auth.user);
  const { currentData, isLoading, isError, isFetching, refetch } =
    useGetFeedQuery({ page, limit: PAGE_SIZE });
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const {
    handleUpdatePost,
    handleDeletePost,
    isUpdating,
    isDeleting,
  } = usePostManagement();
  const feed = currentData?.data;

  const handleCreatePost = async (formData: FormData) => {
    try {
      await createPost(formData).unwrap();
      toast.success("Your post is live.");
      setPage(1);
      setComposerVersion((version) => version + 1);
      return true;
    } catch (error) {
      toast.error(getPostErrorMessage(error));
      return false;
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <header className="mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-primary-950 via-primary-800 to-primary-700 px-6 py-7 text-white sm:px-8">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3">
                <Network size={25} />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-100">
                  Your professional community
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Professional feed
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-primary-100">
              Updates from you, your connections, and the people you follow.
            </p>
          </header>

          <div className="space-y-4">
            <PostComposer
              key={composerVersion}
              isPending={isCreating}
              onSubmit={handleCreatePost}
            />

            {(isLoading || (isFetching && !currentData)) && (
              <FeedLoadingState />
            )}

            {isError && !isLoading && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
              >
                Could not load your feed. Please try again.
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
                Updating feed...
              </p>
            )}

            {!isLoading && !isError && feed?.posts.length === 0 && (
              <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="rounded-full bg-primary-50 p-4 text-primary-800">
                  <UsersRound size={25} />
                </div>
                <h2 className="mt-4 font-semibold text-slate-900">
                  Your feed is ready for updates
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Share your first post or connect with people to see their
                  updates here.
                </p>
                <Link
                  href="/network/suggestions"
                  className="mt-4 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900"
                >
                  Find people to connect with
                </Link>
              </section>
            )}

            {!isError &&
              feed?.posts.map((post) => (
                <FeedPostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id ?? ""}
                  isDeleting={isDeleting}
                  isUpdating={isUpdating}
                  onUpdate={handleUpdatePost}
                  onDelete={handleDeletePost}
                />
              ))}

            {feed && feed.posts.length > 0 && (
              <FeedPagination
                page={feed.pagination.page}
                totalPages={feed.pagination.totalPages}
                isFetching={isFetching}
                onPageChange={setPage}
              />
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
