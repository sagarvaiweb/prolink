"use client";

import { MapPin, Pencil } from "lucide-react";
import { Profile } from "@/types/profile.types";
import { User } from "@/types/auth.types";

interface Props {
  profile: Profile;
  user: User;
  onEdit: () => void;
}

export default function ProfileHeader({ profile, user, onEdit }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="h-32 bg-linear-to-r from-primary-900 to-primary-700" />

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12">
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

          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-sm font-medium text-primary-800 border border-primary-800 rounded-lg px-4 py-2 hover:bg-primary-50 transition-colors mb-2"
          >
            <Pencil size={14} />
            Edit profile
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-4">
          {user.firstName} {user.lastName}
        </h1>
        {profile.headline && <p className="text-gray-600 mt-1">{profile.headline}</p>}

        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {profile.location}
            </span>
          )}
          <span>{profile.viewCount} profile views</span>
        </div>

        {profile.bio && <p className="text-gray-700 mt-4 leading-relaxed">{profile.bio}</p>}

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Profile strength</span>
            <span>{profile.profileCompletion}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-500"
              style={{ width: `${profile.profileCompletion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}