"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { ConnectionStatusData, SafeUserProfile } from "@/types/networking.types";
import ConnectionButton from "./ConnectionButton";
import NetworkingAvatar from "./NetworkingAvatar";

interface NetworkingUserCardProps {
  user: SafeUserProfile;
  action?: ReactNode;
  connectionId?: string;
  connectionStatus?: ConnectionStatusData["status"];
  onDismiss?: () => void;
  className?: string;
}

export default function NetworkingUserCard({
  user,
  action,
  connectionId,
  connectionStatus,
  onDismiss,
  className = "",
}: NetworkingUserCardProps) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const profileParams = new URLSearchParams({
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
  });

  if (connectionId) {
    profileParams.set("connectionId", connectionId);
  }

  const profileHref = `/network/profile/${encodeURIComponent(user._id)}?${profileParams.toString()}`;

  return (
    <article
      className={`relative flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center ${className}`}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss ${fullName}`}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
      <Link
        href={profileHref}
        aria-label={`View ${fullName}'s profile`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
      >
        <NetworkingAvatar
          avatar={user.avatar}
          firstName={user.firstName}
          lastName={user.lastName}
          size="lg"
        />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{fullName}</h3>
          <p className="truncate text-sm text-gray-500">@{user.username}</p>
          <span className="mt-1 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium capitalize text-violet-700">
            {user.role}
          </span>
        </div>
      </Link>
      <div className="flex shrink-0 items-center">
        {action ?? (
          <ConnectionButton
            userId={user._id}
            connectionId={connectionId}
            status={connectionStatus}
          />
        )}
      </div>
    </article>
  );
}
