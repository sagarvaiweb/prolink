"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { getPostErrorMessage } from "@/components/posts/postErrors";
import {
  useGetPostReportsQuery,
  useReviewPostReportMutation,
} from "@/redux/features/posts/postsApi";
import { useAppSelector } from "@/redux/hooks";
import type { FeedPost, PostAuthor, PostReport } from "@/types/post.types";

const PAGE_SIZE = 10;

const reasonLabels: Record<PostReport["reason"], string> = {
  spam: "Spam or misleading content",
  harassment: "Harassment or bullying",
  misinformation: "False or misleading information",
  inappropriate: "Inappropriate content",
  other: "Other",
};

const getAuthorName = (author: PostAuthor | string | null | undefined) =>
  typeof author === "object" && author
    ? `${author.firstName} ${author.lastName}`
    : "Unavailable user";

function ReportedPostPreview({ post }: { post: FeedPost }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">
          Post by {getAuthorName(post.author)}
        </p>
        <Link
          href={`/posts/${post._id}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:underline"
        >
          View post
          <ExternalLink size={13} />
        </Link>
      </div>
      {post.content && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
          {post.content}
        </p>
      )}
      {post.mediaUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {post.mediaUrls.slice(0, 4).map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="h-28 overflow-hidden rounded-lg bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Reported post attachment ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
  isReviewing,
  onDismiss,
  onRemovePost,
}: {
  report: PostReport;
  isReviewing: boolean;
  onDismiss: () => void;
  onRemovePost: () => Promise<boolean>;
}) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const post = typeof report.post === "object" ? report.post : null;
  const reporter =
    typeof report.reporter === "object" ? report.reporter : null;
  const reportedAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.createdAt));
  const handleRemovePost = async () => {
    const removed = await onRemovePost();
    if (removed) setIsRemoveDialogOpen(false);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
            <Flag size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">
              {reasonLabels[report.reason]}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Reported by{" "}
              <span className="font-medium text-slate-700">
                {reporter
                  ? `${reporter.firstName} ${reporter.lastName}`
                  : "Unavailable user"}
              </span>{" "}
              · {reportedAt}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Pending
        </span>
      </div>

      {report.details && (
        <div className="mt-4 rounded-xl bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Reporter details
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {report.details}
          </p>
        </div>
      )}

      {post ? (
        <ReportedPostPreview post={post} />
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          The reported post is no longer available.
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isReviewing}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReviewing ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          Dismiss report
        </button>
        <button
          type="button"
          onClick={() => setIsRemoveDialogOpen(true)}
          disabled={isReviewing || !post}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          Remove post
        </button>
      </div>

      <ConfirmationDialog
        isOpen={isRemoveDialogOpen}
        title="Remove this post?"
        description="This permanently removes the post, its media, and related engagement. This action cannot be undone."
        confirmLabel="Remove post"
        isDestructive
        isPending={isReviewing}
        onConfirm={handleRemovePost}
        onCancel={() => setIsRemoveDialogOpen(false)}
      />
    </article>
  );
}

export default function AdminPostReportsPage() {
  const [page, setPage] = useState(1);
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";
  const { currentData, isLoading, isFetching, isError, refetch } =
    useGetPostReportsQuery(
      { page, limit: PAGE_SIZE },
      { skip: !isAdmin }
    );
  const [reviewReport, { isLoading: isReviewing }] =
    useReviewPostReportMutation();
  const reportPage = currentData?.data;

  const handleReview = async (
    report: PostReport,
    status: "dismissed" | "post_removed"
  ) => {
    try {
      await reviewReport({ reportId: report._id, status }).unwrap();
      toast.success(
        status === "dismissed" ? "Report dismissed." : "Reported post removed."
      );
      if (reportPage?.reports.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }
      return true;
    } catch (error) {
      toast.error(getPostErrorMessage(error));
      return false;
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/feed"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-primary-800"
          >
            <ArrowLeft size={16} />
            Back to feed
          </Link>

          {!isAdmin ? (
            <section
              role="alert"
              className="flex flex-col items-center rounded-2xl border border-red-200 bg-white px-6 py-12 text-center"
            >
              <ShieldCheck size={32} className="text-red-600" />
              <h1 className="mt-3 text-xl font-bold text-slate-900">
                Admin access required
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                You don&apos;t have permission to review post reports.
              </p>
            </section>
          ) : (
            <>
              <header className="mb-6 flex items-center gap-4 rounded-3xl bg-linear-to-br from-slate-950 via-slate-800 to-primary-900 px-5 py-6 text-white sm:px-8 sm:py-7">
                <div className="rounded-2xl bg-white/10 p-3">
                  <ShieldCheck size={25} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Community safety
                  </p>
                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    Post moderation
                  </h1>
                  {reportPage && (
                    <p className="mt-1 text-sm text-slate-300">
                      {reportPage.pagination.total} pending{" "}
                      {reportPage.pagination.total === 1 ? "report" : "reports"}
                    </p>
                  )}
                </div>
              </header>

              {isLoading && (
                <div role="status" aria-busy="true" className="space-y-4">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      aria-hidden="true"
                      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="h-4 w-44 rounded bg-slate-100" />
                      <div className="h-20 rounded bg-slate-100" />
                      <div className="h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  ))}
                  <span className="sr-only">Loading reports...</span>
                </div>
              )}

              {isError && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                >
                  <AlertTriangle className="mr-1 inline" size={16} />
                  Could not load pending reports.
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
                <p role="status" className="mb-3 text-center text-sm text-slate-500">
                  Updating reports...
                </p>
              )}

              {!isLoading && !isError && reportPage?.reports.length === 0 && (
                <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                  <span className="rounded-full bg-emerald-50 p-4 text-emerald-700">
                    <ShieldCheck size={26} />
                  </span>
                  <h2 className="mt-4 font-semibold text-slate-900">
                    You&apos;re all caught up
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    There are no pending post reports to review.
                  </p>
                </section>
              )}

              {!isError && (
                <div className="space-y-4">
                  {reportPage?.reports.map((report) => (
                    <ReportCard
                      key={report._id}
                      report={report}
                      isReviewing={isReviewing}
                      onDismiss={() =>
                        void handleReview(report, "dismissed")
                      }
                      onRemovePost={() =>
                        handleReview(report, "post_removed")
                      }
                    />
                  ))}
                </div>
              )}

              {reportPage && reportPage.pagination.totalPages > 1 && (
                <nav
                  aria-label="Report pages"
                  className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4"
                >
                  <p className="text-sm text-slate-500">
                    Page {reportPage.pagination.page} of{" "}
                    {reportPage.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage - 1)}
                      disabled={page <= 1 || isFetching}
                      aria-label="Previous report page"
                      className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={
                        page >= reportPage.pagination.totalPages || isFetching
                      }
                      aria-label="Next report page"
                      className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
