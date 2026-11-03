"use client";

import { useEffect, useState } from "react";
import { Flag, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useReportPostMutation } from "@/redux/features/posts/postsApi";
import type { PostReportReason } from "@/types/post.types";
import { getPostErrorMessage } from "@/components/posts/postErrors";

const REPORT_REASONS: { value: PostReportReason; label: string }[] = [
  { value: "spam", label: "Spam or misleading content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misinformation", label: "False or misleading information" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
];

interface PostReportActionProps {
  postId: string;
}

export default function PostReportAction({ postId }: PostReportActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<PostReportReason | "">("");
  const [details, setDetails] = useState("");
  const [reportPost, { isLoading }] = useReportPostMutation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) return;
    try {
      await reportPost({ postId, reason, details: details.trim() }).unwrap();
      setIsOpen(false);
      setReason("");
      setDetails("");
      toast.success("Thanks. Your report was sent for review.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-red-700"
      >
        <Flag size={17} aria-hidden="true" />
        Report
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoading) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`report-post-title-${postId}`}
            aria-describedby={`report-post-description-${postId}`}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2
                  id={`report-post-title-${postId}`}
                  className="text-lg font-semibold text-slate-900"
                >
                  Report this post
                </h2>
                <p
                  id={`report-post-description-${postId}`}
                  className="mt-1 text-sm leading-5 text-slate-500"
                >
                  Reports are reviewed by our moderation team. The author
                  won&apos;t be notified who submitted it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                aria-label="Close report dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={(event) => void handleSubmit(event)} className="p-5">
              <label
                htmlFor={`report-reason-${postId}`}
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Why are you reporting this?
              </label>
              <select
                id={`report-reason-${postId}`}
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value as PostReportReason | "")
                }
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
              >
                <option value="" disabled>
                  Select a reason
                </option>
                {REPORT_REASONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label
                htmlFor={`report-details-${postId}`}
                className="mb-2 mt-4 block text-sm font-medium text-slate-700"
              >
                Add details{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id={`report-details-${postId}`}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Share any context that can help us review this post."
                disabled={isLoading}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {details.length}/500
              </p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !reason}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {isLoading ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
