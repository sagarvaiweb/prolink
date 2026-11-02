"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import type { FeedPost, PostVisibility } from "@/types/post.types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

interface PostComposerProps {
  post?: FeedPost;
  isPending: boolean;
  onSubmit: (formData: FormData) => Promise<boolean>;
  onCancel?: () => void;
}

export default function PostComposer({
  post,
  isPending,
  onSubmit,
  onCancel,
}: PostComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const [content, setContent] = useState(post?.content ?? "");
  const [visibility, setVisibility] = useState<PostVisibility>(
    post?.visibility ?? "public"
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [clearExistingMedia, setClearExistingMedia] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const isEditing = Boolean(post);
  const existingMedia = post?.mediaUrls ?? [];

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > MAX_FILES) {
      toast.error("Choose no more than 4 images.");
      return;
    }
    if (files.some((file) => !ALLOWED_TYPES.includes(file.type))) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }
    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      toast.error("Each image must be 5 MB or smaller.");
      return;
    }
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previewUrlsRef.current);
    setSelectedFiles(files);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent && existingMedia.length === 0 && selectedFiles.length === 0) {
      toast.error("Write something or add at least one image.");
      return;
    }
    if (
      !trimmedContent &&
      existingMedia.length > 0 &&
      clearExistingMedia &&
      selectedFiles.length === 0
    ) {
      toast.error("A post must include text or at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    formData.append("visibility", visibility);
    selectedFiles.forEach((file) => formData.append("media", file));
    if (clearExistingMedia && selectedFiles.length === 0) {
      formData.append("clearMedia", "true");
    }
    await onSubmit(formData);
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <label
        htmlFor={isEditing ? `edit-post-${post?._id}` : "new-post-content"}
        className="mb-3 block text-sm font-semibold text-slate-900"
      >
        {isEditing ? "Edit your post" : "Share an update"}
      </label>
      <textarea
        id={isEditing ? `edit-post-${post?._id}` : "new-post-content"}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={3000}
        rows={isEditing ? 4 : 3}
        placeholder="What would you like to share with your network?"
        disabled={isPending}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100 disabled:opacity-60"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span>Who can see this?</span>
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as PostVisibility)
            }
            disabled={isPending}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-primary-500"
          >
            <option value="public">Anyone</option>
            <option value="connections">Connections only</option>
          </select>
        </label>
        <span className="text-xs text-slate-400">{content.length}/3000</span>
      </div>

      {existingMedia.length > 0 && selectedFiles.length === 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {existingMedia.map((url) => (
              <div
                key={url}
                className="h-24 overflow-hidden rounded-lg bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Current post attachment"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setClearExistingMedia((cleared) => !cleared)}
            disabled={isPending}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-50"
          >
            {clearExistingMedia ? "Keep current images" : "Remove current images"}
          </button>
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {previewUrls.map((url, index) => (
              <div
                key={url}
                className="h-24 overflow-hidden rounded-lg bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Selected post image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          {isEditing && existingMedia.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Saving these images will replace the current attachments.
            </p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose up to four JPG or PNG images"
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          <ImagePlus size={18} />
          Add images
        </button>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && <LoaderCircle className="animate-spin" size={16} />}
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Publish post"}
          </button>
        </div>
      </div>
      {!isEditing && (
        <p className="mt-3 text-xs text-slate-400">
          JPG or PNG · up to 4 images · 5 MB per image
        </p>
      )}
    </form>
  );
}
