"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ExternalLink,
  Globe2,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FeedPost } from "@/types/post.types";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import PostComposer from "./PostComposer";
import PostEngagement from "./PostEngagement";

interface FeedPostCardProps {
  post: FeedPost;
  currentUserId: string;
  isDeleting: boolean;
  isUpdating: boolean;
  showDetailLink?: boolean;
  onUpdate: (postId: string, formData: FormData) => Promise<boolean>;
  onDelete: (postId: string) => Promise<boolean>;
}

const getInitials = (author: FeedPost["author"]) =>
  `${author.firstName.charAt(0)}${author.lastName.charAt(0)}`.toUpperCase();

const formatPostDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

export default function FeedPostCard({
  post,
  currentUserId,
  isDeleting,
  isUpdating,
  showDetailLink = true,
  onUpdate,
  onDelete,
}: FeedPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isOwnPost = post.author._id === currentUserId;
  const originalPost =
    typeof post.originalPost === "object" ? post.originalPost : null;

  const handleUpdate = async (formData: FormData) => {
    const updated = await onUpdate(post._id, formData);
    if (updated) setIsEditing(false);
    return updated;
  };

  const handleDelete = async () => {
    const deleted = await onDelete(post._id);
    if (deleted) setIsDeleteDialogOpen(false);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {isEditing ? (
        <div className="p-4 sm:p-5">
          <PostComposer
            key={post._id}
            post={post}
            isPending={isUpdating}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 p-5">
            <Link
              href={`/profile/${post.author._id}`}
              aria-label={`View ${post.author.firstName} ${post.author.lastName}'s profile`}
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-sm font-bold text-primary-800"
            >
              {post.author.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(post.author)
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/profile/${post.author._id}`}
                    className="truncate font-semibold text-slate-900 hover:text-primary-800"
                  >
                    {post.author.firstName} {post.author.lastName}
                  </Link>
                  <p className="truncate text-sm text-slate-500">
                    @{post.author.username}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <time dateTime={post.createdAt}>
                      {formatPostDate(post.createdAt)}
                    </time>
                    {post.isEdited && <span>· Edited</span>}
                    <span aria-hidden="true">·</span>
                    {post.visibility === "connections" ? (
                      <LockKeyhole size={12} aria-label="Connections only" />
                    ) : (
                      <Globe2 size={12} aria-label="Public" />
                    )}
                    <span>
                      {post.visibility === "connections"
                        ? "Connections"
                        : "Public"}
                    </span>
                  </div>
                </div>
                {isOwnPost && (
                  <div className="group relative">
                    <button
                      type="button"
                      aria-label="Post actions"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    <div className="invisible absolute right-0 top-full z-10 mt-1 min-w-40 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                        Edit post
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Delete post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {post.content && (
            <p className="whitespace-pre-wrap wrap-break-word px-5 pb-4 text-sm leading-7 text-slate-700">
              {post.content}
            </p>
          )}

          {originalPost && (
            <div className="mx-5 mb-4 rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">
                Originally shared by{" "}
                {originalPost.author
                  ? `${originalPost.author.firstName} ${originalPost.author.lastName}`
                  : "a ProLink member"}
              </p>
              {originalPost.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {originalPost.content}
                </p>
              )}
            </div>
          )}

          {post.mediaUrls.length > 0 && (
            <div
              className={`grid gap-1 ${
                post.mediaUrls.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-2"
              }`}
            >
              {post.mediaUrls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block max-h-136 overflow-hidden bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Post attachment ${index + 1}`}
                    className="max-h-136 w-full object-contain"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}

          <div className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3">
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              {post.shareCount > 0 && (
                <span>
                  {post.shareCount} {post.shareCount === 1 ? "share" : "shares"}
                </span>
              )}
            </div>
            {showDetailLink && (
              <Link
                href={`/posts/${post._id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
              >
                View post
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
          <PostEngagement
            postId={post._id}
            isLiked={post.isLiked}
            likeCount={post.likeCount}
            commentCount={post.commentCount}
            currentUserId={currentUserId}
          />
        </>
      )}

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        title="Delete this post?"
        description="This will permanently remove your post and its attached images."
        confirmLabel="Delete post"
        isDestructive
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </article>
  );
}
