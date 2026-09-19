"use client";

import { Check, LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  useFollowUserMutation,
  useGetFollowStatusQuery,
  useUnfollowUserMutation,
} from "@/redux/features/networking/networkingApi";
import { getNetworkingErrorMessage } from "./networking.utils";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export default function FollowButton({ userId, className = "" }: FollowButtonProps) {
  const { data, isLoading: isStatusLoading } = useGetFollowStatusQuery(userId);
  const [followUser, followState] = useFollowUserMutation();
  const [unfollowUser, unfollowState] = useUnfollowUserMutation();
  const isFollowing = data?.data.isFollowing;
  const isMutating = followState.isLoading || unfollowState.isLoading;

  const handleClick = async () => {
    try {
      const response = isFollowing
        ? await unfollowUser(userId).unwrap()
        : await followUser(userId).unwrap();
      toast.success(response.message);
    } catch (error) {
      toast.error(
        getNetworkingErrorMessage(
          error,
          isFollowing ? "Unable to unfollow this user." : "Unable to follow this user."
        )
      );
    }
  };

  const isLoading = isStatusLoading || isMutating || isFollowing === undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
        isFollowing
          ? "border border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100 active:bg-blue-200"
          : "bg-blue-800 text-white hover:bg-blue-900 active:bg-blue-950"
      } ${className}`}
    >
      {isLoading ? (
        <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Working…</>
      ) : isFollowing ? (
        <><Check size={16} aria-hidden="true" />Following</>
      ) : (
        <><UserPlus size={16} aria-hidden="true" />Follow</>
      )}
    </button>
  );
}
