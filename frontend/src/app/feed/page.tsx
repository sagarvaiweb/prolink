"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  LoaderCircle,
  Network,
  RefreshCw,
  ShieldCheck,
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
  const [isFeedToolsOpen, setIsFeedToolsOpen] = useState(false);
  const feedToolsRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!isFeedToolsOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!feedToolsRef.current?.contains(event.target as Node)) {
        setIsFeedToolsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFeedToolsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFeedToolsOpen]);

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
          <header className="relative isolate mb-6 rounded-3xl bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 px-6 py-7 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.8)] sm:px-8 sm:py-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
              <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="hidden rounded-2xl border border-white/10 bg-white/[0.07] p-3 text-amber-100 shadow-inner shadow-white/5 backdrop-blur sm:block">
                  <Network size={25} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90 sm:text-xs">
                    Your professional community
                  </p>
                  <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                    Professional feed
                  </h1>
                </div>
              </div>
              <div className="relative shrink-0" ref={feedToolsRef}>
                <button
                  type="button"
                  aria-expanded={isFeedToolsOpen}
                  aria-haspopup="menu"
                  aria-controls="feed-tools-menu"
                  onClick={() => setIsFeedToolsOpen((open) => !open)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:border-white/25 hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:px-3.5"
                >
                  <Ellipsis size={18} />
                  <span className="hidden sm:inline">Feed tools</span>
                  <ChevronDown size={14} className={`hidden transition sm:block ${isFeedToolsOpen ? "rotate-180" : ""}`} />
                </button>
                {isFeedToolsOpen && (
                  <div id="feed-tools-menu" role="menu" aria-label="Feed tools" className="absolute right-0 top-[calc(100%+0.65rem)] z-30 w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl shadow-slate-950/25">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Your shortcuts</p>
                    <Link href="/saved-posts" role="menuitem" onClick={() => setIsFeedToolsOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-primary-50 hover:text-primary-900">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><BookmarkCheck size={17} /></span>
                      Saved posts
                    </Link>
                    {(user?.role === "student" || user?.role === "professional") && (
                      <Link href="/applications" role="menuitem" onClick={() => setIsFeedToolsOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-primary-50 hover:text-primary-900">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><BriefcaseBusiness size={17} /></span>
                        My applications
                      </Link>
                    )}
                    {user?.role === "recruiter" && (
                      <Link href="/recruiter/jobs" role="menuitem" onClick={() => setIsFeedToolsOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-primary-50 hover:text-primary-900">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BriefcaseBusiness size={17} /></span>
                        Manage jobs
                      </Link>
                    )}
                    {user?.role === "admin" && (
                      <Link href="/admin/dashboard" role="menuitem" onClick={() => setIsFeedToolsOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-primary-50 hover:text-primary-900">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={17} /></span>
                        Admin workspace
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
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
