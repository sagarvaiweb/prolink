"use client";

import Link from "next/link";
import {
  Check,
  LoaderCircle,
  UserRoundMinus,
  UserRoundPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";
import {
  useAcceptConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useFollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetRelationshipStatusQuery,
  useRejectConnectionRequestMutation,
  useRemoveConnectionMutation,
  useSendConnectionRequestMutation,
  useUnfollowUserMutation,
} from "@/redux/features/network/networkApi";

const COUNT_QUERY_PARAMS = { page: 1, limit: 1 };

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return "Something went wrong. Please try again.";
};

interface Props {
  userId: string;
}

export default function ProfileNetworkPanel({ userId }: Props) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnProfile = currentUser?._id === userId;
  const followersQuery = useGetFollowersQuery({
    userId,
    ...COUNT_QUERY_PARAMS,
  });
  const followingQuery = useGetFollowingQuery({
    userId,
    ...COUNT_QUERY_PARAMS,
  });
  const relationshipQuery = useGetRelationshipStatusQuery(userId, {
    skip: !currentUser || isOwnProfile,
  });

  const [sendRequest, { isLoading: isSendingRequest }] =
    useSendConnectionRequestMutation();
  const [acceptRequest, { isLoading: isAcceptingRequest }] =
    useAcceptConnectionRequestMutation();
  const [rejectRequest, { isLoading: isRejectingRequest }] =
    useRejectConnectionRequestMutation();
  const [cancelRequest, { isLoading: isCancellingRequest }] =
    useCancelConnectionRequestMutation();
  const [removeConnection, { isLoading: isRemovingConnection }] =
    useRemoveConnectionMutation();
  const [followUser, { isLoading: isFollowingUser }] =
    useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowingUser }] =
    useUnfollowUserMutation();

  const relationship = relationshipQuery.currentData?.data;
  const isActionPending =
    relationshipQuery.isFetching ||
    isSendingRequest ||
    isAcceptingRequest ||
    isRejectingRequest ||
    isCancellingRequest ||
    isRemovingConnection ||
    isFollowingUser ||
    isUnfollowingUser;

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleRemoveConnection = () => {
    const connectionId = relationship?.connectionId;
    if (!connectionId) return;
    if (!window.confirm("Remove this connection?")) return;

    void runAction(
      () => removeConnection(connectionId).unwrap(),
      "Connection removed."
    );
  };

  const handleConnectionAction = (
    action: (connectionId: string) => Promise<unknown>,
    successMessage: string
  ) => {
    const connectionId = relationship?.connectionId;
    if (!connectionId) return;

    void runAction(() => action(connectionId), successMessage);
  };

  const renderConnectionAction = () => {
    if (relationshipQuery.isLoading) {
      return (
        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="animate-spin" size={16} />
          Checking connection...
        </span>
      );
    }

    if (relationshipQuery.isError || !relationship) {
      return (
        <div className="text-sm text-red-700">
          Could not load connection status.{" "}
          <button
            type="button"
            onClick={() => void relationshipQuery.refetch()}
            className="font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      );
    }

    const buttonClass =
      "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

    switch (relationship.connectionStatus) {
      case "pending_sent":
        return (
          <button
            type="button"
            disabled={isActionPending}
            onClick={() =>
              handleConnectionAction(
                (connectionId) => cancelRequest(connectionId).unwrap(),
                "Connection request cancelled."
              )
            }
            className={`${buttonClass} border border-slate-200 text-slate-700 hover:bg-slate-50`}
          >
            Cancel request
          </button>
        );
      case "pending_received":
        return (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isActionPending || !relationship.connectionId}
              onClick={() =>
                handleConnectionAction(
                  (connectionId) => acceptRequest(connectionId).unwrap(),
                  "Connection accepted."
                )
              }
              className={`${buttonClass} bg-primary-800 text-white hover:bg-primary-900`}
            >
              <Check size={16} />
              Accept request
            </button>
            <button
              type="button"
              disabled={isActionPending || !relationship.connectionId}
              onClick={() =>
                handleConnectionAction(
                  (connectionId) => rejectRequest(connectionId).unwrap(),
                  "Connection request declined."
                )
              }
              className={`${buttonClass} border border-slate-200 text-slate-700 hover:bg-slate-50`}
            >
              <X size={16} />
              Decline
            </button>
          </div>
        );
      case "connected":
        return (
          <button
            type="button"
            disabled={isActionPending}
            onClick={handleRemoveConnection}
            className={`${buttonClass} border border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700`}
          >
            <UserRoundMinus size={16} />
            Remove connection
          </button>
        );
      case "self":
        return null;
      default:
        return (
          <button
            type="button"
            disabled={isActionPending}
            onClick={() =>
              void runAction(
                () => sendRequest(userId).unwrap(),
                "Connection request sent."
              )
            }
            className={`${buttonClass} bg-primary-800 text-white hover:bg-primary-900`}
          >
            <UserRoundPlus size={16} />
            Connect
          </button>
        );
    }
  };

  const followers = followersQuery.currentData?.data.pagination.total;
  const following = followingQuery.currentData?.data.pagination.total;
  const countError = followersQuery.isError || followingQuery.isError;

  return (
    <section
      aria-label="Profile network"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            href={`/profile/${userId}/followers`}
            className="text-slate-600 transition hover:text-primary-800"
          >
            <span className="font-semibold text-slate-900">
              {followersQuery.isLoading ? "…" : (followers ?? "—")}
            </span>{" "}
            followers
          </Link>
          <Link
            href={`/profile/${userId}/following`}
            className="text-slate-600 transition hover:text-primary-800"
          >
            <span className="font-semibold text-slate-900">
              {followingQuery.isLoading ? "…" : (following ?? "—")}
            </span>{" "}
            following
          </Link>
        </div>
        {countError && (
          <p role="status" className="mt-2 text-xs text-red-700">
            Some network counts could not be loaded.
          </p>
        )}
      </div>

      {currentUser && !isOwnProfile && (
        <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-0">
          {renderConnectionAction()}
          {!relationshipQuery.isLoading &&
          !relationshipQuery.isError &&
          relationship ? (
            <button
              type="button"
              disabled={isActionPending}
              onClick={() =>
                void runAction(
                  () =>
                    relationship.isFollowing
                      ? unfollowUser(userId).unwrap()
                      : followUser(userId).unwrap(),
                  relationship.isFollowing
                    ? "You unfollowed this person."
                    : "You are now following this person."
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {relationship.isFollowing ? (
                <>
                  <UserRoundMinus size={16} />
                  Unfollow
                </>
              ) : (
                <>
                  <UserRoundPlus size={16} />
                  Follow
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
