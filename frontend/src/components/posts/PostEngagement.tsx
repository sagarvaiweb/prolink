"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useAddPostCommentMutation,
  useGetPostCommentsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
} from "@/redux/features/posts/postsApi";
import { getPostErrorMessage } from "@/components/posts/postErrors";
import PostCommentItem from "@/components/posts/PostCommentItem";

const COMMENT_PAGE_SIZE = 10;

interface PostEngagementProps {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  currentUserId: string;
}

export default function PostEngagement({
  postId,
  isLiked,
  likeCount,
  commentCount,
  currentUserId,
}: PostEngagementProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const [likeOverride, setLikeOverride] = useState<{
    isLiked: boolean;
    likeCount: number;
  } | null>(null);
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [unlikePost, { isLoading: isUnliking }] = useUnlikePostMutation();
  const [addComment, { isLoading: isAddingComment }] =
    useAddPostCommentMutation();
  const {
    currentData,
    isLoading: isLoadingComments,
    isFetching: isFetchingComments,
    isError: isCommentsError,
    refetch: refetchComments,
  } = useGetPostCommentsQuery(
    { postId, page, limit: COMMENT_PAGE_SIZE },
    { skip: !isCommentsOpen }
  );
  const likeState = likeOverride ?? { isLiked, likeCount };
  const commentsPage = currentData?.data;

  const handleLike = async () => {
    try {
      const response = likeState.isLiked
        ? await unlikePost(postId).unwrap()
        : await likePost(postId).unwrap();
      setLikeOverride(response.data);
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  const handleAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    try {
      await addComment({ postId, content: trimmedContent }).unwrap();
      setContent("");
      setPage(1);
      setIsCommentsOpen(true);
      toast.success("Comment added.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  return (
    <section aria-label="Post engagement">
      <div className="mx-5 flex flex-wrap items-center gap-2 border-t border-slate-100 py-2">
        <button
          type="button"
          onClick={() => void handleLike()}
          disabled={isLiking || isUnliking}
          aria-pressed={likeState.isLiked}
          aria-label={likeState.isLiked ? "Unlike post" : "Like post"}
          className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            likeState.isLiked
              ? "text-rose-700 hover:bg-rose-50"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Heart
            size={18}
            fill={likeState.isLiked ? "currentColor" : "none"}
            aria-hidden="true"
          />
          {likeState.likeCount > 0 && (
            <span>
              {likeState.likeCount}{" "}
              {likeState.likeCount === 1 ? "Like" : "Likes"}
            </span>
          )}
          {likeState.likeCount === 0 && <span>Like</span>}
        </button>
        <button
          type="button"
          onClick={() => setIsCommentsOpen((open) => !open)}
          aria-expanded={isCommentsOpen}
          aria-controls={`post-comments-${postId}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          <MessageCircle size={18} aria-hidden="true" />
          {commentCount > 0
            ? `${commentCount} ${
                commentCount === 1 ? "Comment" : "Comments"
              }`
            : "Comment"}
        </button>
      </div>

      {isCommentsOpen && (
        <div
          id={`post-comments-${postId}`}
          className="mx-5 border-t border-slate-100 pb-4 pt-4"
        >
          <form onSubmit={(event) => void handleAddComment(event)}>
            <label
              htmlFor={`new-comment-${postId}`}
              className="sr-only"
            >
              Write a comment
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={`new-comment-${postId}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Write a comment..."
                disabled={isAddingComment}
                className="min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isAddingComment || !content.trim()}
                aria-label="Post comment"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-800 text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={17} />
              </button>
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">
              {content.length}/1000
            </p>
          </form>

          {isLoadingComments && (
            <div role="status" className="space-y-3 py-4">
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
              <span className="sr-only">Loading comments...</span>
            </div>
          )}

          {isCommentsError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              Could not load comments.
              <button
                type="button"
                onClick={() => void refetchComments()}
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoadingComments &&
            !isCommentsError &&
            commentsPage?.comments.length === 0 && (
              <p className="py-5 text-center text-sm text-slate-500">
                Be the first to comment.
              </p>
            )}

          {!isCommentsError && (
            <div className="space-y-4">
              {commentsPage?.comments.map((comment) => (
                <PostCommentItem
                  key={comment._id}
                  comment={comment}
                  postId={postId}
                  currentUserId={currentUserId}
                  onDeleted={() => {
                    if (commentsPage.comments.length === 1 && page > 1) {
                      setPage((currentPage) => currentPage - 1);
                    }
                  }}
                />
              ))}
            </div>
          )}

          {commentsPage && commentsPage.pagination.totalPages > 1 && (
            <nav
              aria-label="Comment pages"
              className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"
            >
              <p className="text-xs text-slate-500">
                Page {commentsPage.pagination.page} of{" "}
                {commentsPage.pagination.totalPages}
                {isFetchingComments && " · Updating"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  disabled={page <= 1 || isFetchingComments}
                  aria-label="Previous comments page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  disabled={
                    page >= commentsPage.pagination.totalPages ||
                    isFetchingComments
                  }
                  aria-label="Next comments page"
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
