"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, RefreshCw } from "lucide-react";
import FeedPostCard from "@/components/posts/FeedPostCard";
import usePostManagement from "@/components/posts/usePostManagement";
import { useGetPostsByUserQuery } from "@/redux/features/posts/postsApi";

const PAGE_SIZE = 10;

interface ProfilePostsSectionProps {
  userId: string;
  currentUserId: string;
}

export default function ProfilePostsSection({
  userId,
  currentUserId,
}: ProfilePostsSectionProps) {
  const [page, setPage] = useState(1);
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetPostsByUserQuery({ userId, page, limit: PAGE_SIZE });
  const {
    handleUpdatePost,
    handleDeletePost,
    isUpdating,
    isDeleting,
  } = usePostManagement();
  const postsPage = currentData?.data;

  const onDelete = async (postId: string) => {
    const deleted = await handleDeletePost(postId);
    if (deleted && postsPage?.posts.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
    }
    return deleted;
  };

  return (
    <section
      aria-labelledby="profile-posts-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2
            id="profile-posts-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Posts
          </h2>
          {postsPage && (
            <p className="mt-0.5 text-sm text-slate-500">
              {postsPage.pagination.total}{" "}
              {postsPage.pagination.total === 1 ? "post" : "posts"}
            </p>
          )}
        </div>
        {isFetching && !isLoading && (
          <span role="status" className="text-xs text-slate-500">
            Updating...
          </span>
        )}
      </header>

      <div className="space-y-4 p-4 sm:p-5">
        {isLoading && (
          <div role="status" aria-busy="true" className="space-y-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                aria-hidden="true"
                className="space-y-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="h-4 w-40 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-3/4 rounded bg-slate-100" />
              </div>
            ))}
            <span className="sr-only">Loading posts...</span>
          </div>
        )}

        {isError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            Could not load posts.
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

        {!isLoading && !isError && postsPage?.posts.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center">
            <FileText size={24} className="text-slate-400" />
            <p className="mt-3 font-medium text-slate-800">No posts yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Posts shared by this member will appear here.
            </p>
          </div>
        )}

        {!isError &&
          postsPage?.posts.map((post) => (
            <FeedPostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              isDeleting={isDeleting}
              isUpdating={isUpdating}
              onUpdate={handleUpdatePost}
              onDelete={onDelete}
            />
          ))}

        {postsPage && postsPage.pagination.totalPages > 1 && (
          <nav
            aria-label="Profile post pages"
            className="flex items-center justify-between border-t border-slate-100 pt-4"
          >
            <p className="text-sm text-slate-500">
              Page {postsPage.pagination.page} of{" "}
              {postsPage.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page <= 1 || isFetching}
                aria-label="Previous posts page"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={page >= postsPage.pagination.totalPages || isFetching}
                aria-label="Next posts page"
                className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
