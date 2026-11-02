"use client";

import { useEffect, useState } from "react";
import { Bookmark, LoaderCircle, Repeat2, Send, X } from "lucide-react";
import { toast } from "sonner";
import {
  useSavePostMutation,
  useSharePostMutation,
  useUnsavePostMutation,
} from "@/redux/features/posts/postsApi";
import type { FeedPost, PostVisibility } from "@/types/post.types";
import { getPostErrorMessage } from "@/components/posts/postErrors";

interface PostSharingActionsProps {
  post: FeedPost;
}

export default function PostSharingActions({
  post,
}: PostSharingActionsProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [isSavedOverride, setIsSavedOverride] = useState<boolean | null>(null);
  const [sharePost, { isLoading: isSharing }] = useSharePostMutation();
  const [savePost, { isLoading: isSaving }] = useSavePostMutation();
  const [unsavePost, { isLoading: isUnsaving }] = useUnsavePostMutation();
  const isSaved = isSavedOverride ?? post.isSaved;
  const isSavePending = isSaving || isUnsaving;
  const originalPost =
    typeof post.originalPost === "object" ? post.originalPost : null;
  const canShare = Boolean(post.originalPost) || post.visibility === "public";

  useEffect(() => {
    if (!isShareDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSharing) {
        setIsShareDialogOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isShareDialogOpen, isSharing]);

  const handleSave = async () => {
    try {
      const response = isSaved
        ? await unsavePost(post._id).unwrap()
        : await savePost(post._id).unwrap();
      setIsSavedOverride(response.data.isSaved);
      toast.success(
        response.data.isSaved ? "Post saved for later." : "Post removed from saved posts."
      );
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  const handleShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await sharePost({
        postId: post._id,
        content: content.trim(),
        visibility,
      }).unwrap();
      setContent("");
      setVisibility("public");
      setIsShareDialogOpen(false);
      toast.success("Post shared to your feed.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  return (
    <>
      <div className="mx-5 flex flex-wrap items-center gap-2 border-t border-slate-100 py-2">
        <button
          type="button"
          onClick={() => setIsShareDialogOpen(true)}
          disabled={!canShare}
          title={
            canShare
              ? "Share this post"
              : "Connection-only posts cannot be reshared"
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Repeat2 size={18} aria-hidden="true" />
          <span>Repost</span>
          {post.shareCount > 0 && (
            <span className="text-xs text-slate-500">{post.shareCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSavePending}
          aria-pressed={isSaved}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isSaved
              ? "text-primary-800 hover:bg-primary-50"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {isSavePending ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <Bookmark
              size={18}
              fill={isSaved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      {isShareDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSharing) {
              setIsShareDialogOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-post-title-${post._id}`}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id={`share-post-title-${post._id}`}
                className="text-lg font-semibold text-slate-900"
              >
                Share this post
              </h2>
              <button
                type="button"
                onClick={() => setIsShareDialogOpen(false)}
                disabled={isSharing}
                aria-label="Close share dialog"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={(event) => void handleShare(event)} className="p-5">
              <label
                htmlFor={`share-content-${post._id}`}
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Add a message <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id={`share-content-${post._id}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="Say something about this post..."
                disabled={isSharing}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label
                  htmlFor={`share-visibility-${post._id}`}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  Audience
                  <select
                    id={`share-visibility-${post._id}`}
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as PostVisibility)
                    }
                    disabled={isSharing}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-primary-500"
                  >
                    <option value="public">Anyone</option>
                    <option value="connections">Connections only</option>
                  </select>
                </label>
                <span className="text-xs text-slate-400">
                  {content.length}/3000
                </span>
              </div>

              {originalPost && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Originally shared by{" "}
                    {originalPost.author
                      ? `${originalPost.author.firstName} ${originalPost.author.lastName}`
                      : "a ProLink member"}
                  </p>
                  {originalPost.content && (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-slate-700">
                      {originalPost.content}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsShareDialogOpen(false)}
                  disabled={isSharing}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSharing ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {isSharing ? "Sharing..." : "Share post"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
