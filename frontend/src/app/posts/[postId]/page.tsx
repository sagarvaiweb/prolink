"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import FeedPostCard from "@/components/posts/FeedPostCard";
import usePostManagement from "@/components/posts/usePostManagement";
import { useGetPostByIdQuery } from "@/redux/features/posts/postsApi";
import { useAppSelector } from "@/redux/hooks";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError, refetch } = useGetPostByIdQuery(postId);
  const {
    handleUpdatePost,
    handleDeletePost,
    isUpdating,
    isDeleting,
  } = usePostManagement();

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

          <h1 className="mb-5 text-2xl font-bold text-slate-900">
            Post
          </h1>

          {isLoading && (
            <div
              role="status"
              aria-busy="true"
              className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-4 w-44 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
              <div className="h-3 w-4/5 rounded bg-slate-100" />
              <span className="sr-only">Loading post...</span>
            </div>
          )}

          {isError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              This post could not be loaded. It may have been removed or you
              may not have permission to view it.
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

          {!isError && data?.data && (
            <FeedPostCard
              post={data.data}
              currentUserId={user?._id ?? ""}
              isDeleting={isDeleting}
              isUpdating={isUpdating}
              showDetailLink={false}
              onUpdate={handleUpdatePost}
              onDelete={handleDeletePost}
            />
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
