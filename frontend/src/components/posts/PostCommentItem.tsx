"use client";

import Link from "next/link";
import { useState } from "react";
import { CornerDownRight, LoaderCircle, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import {
  useAddPostCommentMutation,
  useDeletePostCommentMutation,
  useGetCommentRepliesQuery,
  useUpdatePostCommentMutation,
} from "@/redux/features/posts/postsApi";
import type { PostComment } from "@/types/post.types";
import { getPostErrorMessage } from "@/components/posts/postErrors";

const REPLY_PAGE_SIZE = 10;

interface PostCommentItemProps {
  comment: PostComment;
  postId: string;
  currentUserId: string;
  isReply?: boolean;
  onDeleted?: () => void;
}

export default function PostCommentItem({
  comment,
  postId,
  currentUserId,
  isReply = false,
  onDeleted,
}: PostCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [replyPage, setReplyPage] = useState(1);
  const [updateComment, { isLoading: isUpdating }] =
    useUpdatePostCommentMutation();
  const [deleteComment, { isLoading: isDeleting }] =
    useDeletePostCommentMutation();
  const [addReply, { isLoading: isAddingReply }] = useAddPostCommentMutation();
  const {
    currentData,
    isLoading: isLoadingReplies,
    isFetching: isFetchingReplies,
    isError: isRepliesError,
    refetch: refetchReplies,
  } = useGetCommentRepliesQuery(
    {
      postId,
      commentId: comment._id,
      page: replyPage,
      limit: REPLY_PAGE_SIZE,
    },
    { skip: !isRepliesOpen || isReply }
  );
  const isOwnComment = comment.author._id === currentUserId;
  const replyData = currentData?.data;

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    try {
      await updateComment({
        postId,
        commentId: comment._id,
        content: trimmedContent,
      }).unwrap();
      setIsEditing(false);
      toast.success("Comment updated.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment({
        postId,
        commentId: comment._id,
        parentComment: comment.parentComment,
      }).unwrap();
      setIsDeleteDialogOpen(false);
      onDeleted?.();
      toast.success(isReply ? "Reply deleted." : "Comment deleted.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  const handleAddReply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = replyContent.trim();
    if (!trimmedContent) return;

    try {
      await addReply({
        postId,
        parentComment: comment._id,
        content: trimmedContent,
      }).unwrap();
      setReplyContent("");
      setReplyPage(1);
      setIsRepliesOpen(true);
      setIsReplying(false);
      toast.success("Reply added.");
    } catch (error) {
      toast.error(getPostErrorMessage(error));
    }
  };

  const fullName = `${comment.author.firstName} ${comment.author.lastName}`;

  return (
    <article className={isReply ? "border-l-2 border-slate-200 pl-3 sm:pl-4" : ""}>
      <div className="rounded-xl bg-slate-50 px-3 py-3 sm:px-4">
        <div className="flex items-start gap-2.5">
          <Link
            href={`/profile/${comment.author._id}`}
            aria-label={`View ${fullName}'s profile`}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-bold text-primary-800"
          >
            {comment.author.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comment.author.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              `${comment.author.firstName[0] ?? ""}${comment.author.lastName[0] ?? ""}`.toUpperCase()
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <Link
                href={`/profile/${comment.author._id}`}
                className="text-sm font-semibold text-slate-900 hover:text-primary-800"
              >
                {fullName}
              </Link>
              <time
                dateTime={comment.createdAt}
                className="text-xs text-slate-400"
              >
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(comment.createdAt))}
              </time>
              {comment.isEdited && (
                <span className="text-xs text-slate-400">· Edited</span>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={(event) => void handleUpdate(event)} className="mt-2">
                <label htmlFor={`edit-comment-${comment._id}`} className="sr-only">
                  Edit comment
                </label>
                <textarea
                  id={`edit-comment-${comment._id}`}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={1000}
                  rows={2}
                  disabled={isUpdating}
                  className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContent(comment.content);
                      setIsEditing(false);
                    }}
                    disabled={isUpdating}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !content.trim()}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-900 disabled:opacity-50"
                  >
                    {isUpdating && <LoaderCircle size={13} className="animate-spin" />}
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {comment.content}
              </p>
            )}

            {!isEditing && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {!isReply && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplying((replying) => !replying);
                      setIsRepliesOpen(true);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-primary-800"
                  >
                    Reply
                  </button>
                )}
                {!isReply && (comment.replyCount ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsRepliesOpen((open) => !open)}
                    aria-expanded={isRepliesOpen}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-950"
                  >
                    <CornerDownRight size={13} />
                    {isRepliesOpen
                      ? "Hide replies"
                      : `View ${comment.replyCount} ${
                          comment.replyCount === 1 ? "reply" : "replies"
                        }`}
                  </button>
                )}
                {isOwnComment && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setContent(comment.content);
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-primary-800"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isReply && isReplying && (
        <form
          onSubmit={(event) => void handleAddReply(event)}
          className="ml-4 mt-2 flex items-end gap-2 sm:ml-5"
        >
          <label htmlFor={`reply-${comment._id}`} className="sr-only">
            Write a reply
          </label>
          <textarea
            id={`reply-${comment._id}`}
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            maxLength={1000}
            rows={1}
            placeholder="Write a reply..."
            disabled={isAddingReply}
            className="min-h-10 flex-1 resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isAddingReply || !replyContent.trim()}
            aria-label="Post reply"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-50"
          >
            {isAddingReply ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      )}

      {!isReply && isRepliesOpen && (
        <div className="ml-4 mt-3 space-y-3 sm:ml-5">
          {isLoadingReplies && (
            <div role="status" className="py-2 text-xs text-slate-500">
              Loading replies...
            </div>
          )}
          {isRepliesError && (
            <div role="alert" className="text-xs text-red-700">
              Could not load replies.{" "}
              <button
                type="button"
                onClick={() => void refetchReplies()}
                className="font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}
          {!isRepliesError &&
            replyData?.replies.map((reply) => (
              <PostCommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                currentUserId={currentUserId}
                isReply
                onDeleted={() => {
                  if (replyData?.replies.length === 1 && replyPage > 1) {
                    setReplyPage((currentPage) => currentPage - 1);
                  }
                }}
              />
            ))}
          {replyData && replyData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {replyData.pagination.page} of{" "}
                {replyData.pagination.totalPages}
                {isFetchingReplies && " · Updating"}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReplyPage((currentPage) => currentPage - 1)}
                  disabled={replyPage <= 1 || isFetchingReplies}
                  className="font-semibold text-primary-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setReplyPage((currentPage) => currentPage + 1)}
                  disabled={
                    replyPage >= replyData.pagination.totalPages ||
                    isFetchingReplies
                  }
                  className="font-semibold text-primary-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title={isReply ? "Delete this reply?" : "Delete this comment?"}
        description={
          isReply
            ? "This will permanently remove your reply."
            : "This will permanently remove your comment and all its replies."
        }
        confirmLabel={isReply ? "Delete reply" : "Delete comment"}
        isDestructive
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </article>
  );
}
