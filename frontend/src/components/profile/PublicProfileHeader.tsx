"use client";

import { MapPin } from "lucide-react";
import { PopulatedProfile } from "@/types/profile.types";

interface PublicUser {
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface Props {
  profile: PopulatedProfile;
  user: PublicUser;
}

export default function PublicProfileHeader({ profile, user }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div
        className="h-32"
        style={{
          backgroundImage: profile.coverPhoto ? `url(${profile.coverPhoto})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!profile.coverPhoto && (
          <div className="w-full h-full bg-linear-to-r from-primary-900 to-primary-700" />
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-end -mt-12">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-800 text-white text-2xl font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {user.firstName} {user.lastName}
        </h1>
        <span className="inline-block text-xs font-medium text-primary-800 bg-primary-50 rounded-full px-2.5 py-0.5 mt-1 capitalize">
          {user.role}
        </span>

        {profile.headline && <p className="text-gray-600 mt-2">{profile.headline}</p>}

        {profile.location && (
          <span className="flex items-center gap-1 text-sm text-gray-500 mt-3">
            <MapPin size={14} />
            {profile.location}
          </span>
        )}

        {profile.bio && <p className="text-gray-700 mt-4 leading-relaxed">{profile.bio}</p>}
      </div>
    </div>
  );
}