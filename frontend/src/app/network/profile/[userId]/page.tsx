"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import NetworkingAvatar from "@/components/networking/NetworkingAvatar";
import ConnectionButton from "@/components/networking/ConnectionButton";
import { NetworkingEmptyState } from "@/components/networking/NetworkingStates";
import {
  useGetConnectionStatusQuery,
  useGetFollowCountQuery,
} from "@/redux/features/networking/networkingApi";
import { useAppSelector } from "@/redux/hooks";
import type { SafeUserProfile } from "@/types/networking.types";

const profileRoles = ["student", "professional", "recruiter", "admin"] as const;

const isProfileRole = (
  role: string | null
): role is SafeUserProfile["role"] => profileRoles.includes(role as SafeUserProfile["role"]);

function OtherUserProfileContent() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const currentUserId = useAppSelector((state) => state.auth.user?._id);
  const targetUserId = params.userId;
  const firstName = searchParams.get("firstName");
  const lastName = searchParams.get("lastName");
  const username = searchParams.get("username");
  const role = searchParams.get("role");
  const avatar = searchParams.get("avatar") ?? "";
  const connectionId = searchParams.get("connectionId") ?? undefined;
  const profile: SafeUserProfile | null =
    firstName && lastName && username && isProfileRole(role)
    ? {
        _id: targetUserId,
        firstName,
        lastName,
        username,
        role,
        avatar,
      }
    : null;
  const isOwnProfile = currentUserId === targetUserId;
  const {
    data: connectionStatusData,
    isError: isConnectionStatusError,
  } = useGetConnectionStatusQuery(targetUserId, {
    skip: !profile || isOwnProfile,
  });
  const {
    data: followCountData,
    isError: isFollowCountError,
    isLoading: isFollowCountLoading,
  } = useGetFollowCountQuery(targetUserId, {
    skip: !profile || isOwnProfile,
  });

  if (!profile) {
    return (
      <NetworkingEmptyState
        title="Profile details unavailable"
        description="Open this profile from a network list so ProLink can display the safe profile information currently available."
        action={
          <Link
            href="/network"
            className="rounded-xl bg-blue-800 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
          >
            Back to My Network
          </Link>
        }
      />
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const counts = followCountData?.data;
  const connectionStatus = connectionStatusData?.data.status;
  const needsConnectionId =
    connectionStatus === "pending_sent" ||
    connectionStatus === "pending_received" ||
    connectionStatus === "accepted";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="h-24 bg-linear-to-r from-blue-800 to-blue-600 sm:h-32" />
      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-7 flex flex-col gap-4 sm:-mt-8 sm:flex-row sm:items-end sm:justify-between">
          <NetworkingAvatar
            avatar={profile.avatar}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size="lg"
          />
          {isOwnProfile && (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
              Your profile
            </span>
          )}
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{fullName}</h1>
          <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>
          <span className="mt-3 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium capitalize text-violet-700">
            {profile.role}
          </span>
        </div>

        {!isOwnProfile && (
          <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Connection</h2>
              <div className="mt-3">
                {!isConnectionStatusError && (
                  <ConnectionButton
                    userId={targetUserId}
                    connectionId={connectionId}
                    status={connectionStatus}
                  />
                )}
              </div>
              {needsConnectionId && !connectionId && !isConnectionStatusError && (
                <p className="mt-2 text-sm text-gray-500">
                  This connection request can be managed from its original request or connection list.
                </p>
              )}
              {isConnectionStatusError && (
                <p className="mt-2 text-sm text-gray-500">
                  Connection status is currently unavailable.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
              <div className="rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-700">Followers</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {isFollowCountLoading ? "..." : counts?.followersCount ?? "-"}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-3">
                <p className="text-xs font-medium text-violet-700">Following</p>
                <p className="mt-1 text-xl font-bold text-gray-900">
                  {isFollowCountLoading ? "..." : counts?.followingCount ?? "-"}
                </p>
              </div>
            </div>
          </div>
        )}
        {isFollowCountError && !isOwnProfile && (
          <p className="mt-3 text-sm text-gray-500">Network statistics are currently unavailable.</p>
        )}
      </div>
    </section>
  );
}

export default function OtherUserProfilePage() {
  return (
    <ProtectedRoute>
      <main className="min-h-full bg-[#F4F7FB] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <OtherUserProfileContent />
        </div>
      </main>
    </ProtectedRoute>
  );
}
