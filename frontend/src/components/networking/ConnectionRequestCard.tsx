"use client";

import type { ConnectionRequestItem, SafeUserProfile } from "@/types/networking.types";
import ConnectionButton from "./ConnectionButton";
import NetworkingAvatar from "./NetworkingAvatar";

type RequestMode = "received" | "sent";

interface ConnectionRequestCardProps {
  request: ConnectionRequestItem & {
    requester?: SafeUserProfile | null;
    recipient?: SafeUserProfile | null;
  };
  mode: RequestMode;
  className?: string;
}

export default function ConnectionRequestCard({
  request,
  mode,
  className = "",
}: ConnectionRequestCardProps) {
  const user = mode === "received" ? request.requester : request.recipient;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "Unavailable user";

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {user ? (
          <NetworkingAvatar
            avatar={user.avatar}
            firstName={user.firstName}
            lastName={user.lastName}
            size="lg"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-500">
            ?
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {mode === "received" ? "Connection request" : "Request sent"}
          </p>
          <h3 className="truncate font-semibold text-gray-900">{fullName}</h3>
          {user && (
            <p className="truncate text-sm text-gray-500">
              @{user.username} · <span className="capitalize">{user.role}</span>
            </p>
          )}
        </div>
      </div>
      {user && (
        <ConnectionButton
          userId={user._id}
          connectionId={request._id}
          status={mode === "received" ? "pending_received" : "pending_sent"}
        />
      )}
    </article>
  );
}
