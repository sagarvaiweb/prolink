"use client";

import { useState } from "react";

interface NetworkingAvatarProps {
  avatar: string;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
};

export default function NetworkingAvatar({
  avatar,
  firstName,
  lastName,
  size = "md",
}: NetworkingAvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (!avatar || hasImageError) {
    return (
      <span
        aria-label={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800`}
      >
        {initials || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- profile avatar URLs are supplied by the API and have no configured Next image host.
    <img
      src={avatar}
      alt=""
      aria-hidden="true"
      className={`${sizeClasses[size]} shrink-0 rounded-full border border-gray-100 object-cover`}
      onError={() => setHasImageError(true)}
    />
  );
}
