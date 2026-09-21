"use client";

import { MapPin, Pencil } from "lucide-react";
import { Profile } from "@/types/profile.types";
import { User } from "@/types/auth.types";
import AvatarUpload from "./AvatarUpload";
import CoverPhotoUpload from "./CoverPhotoUpload";


interface Props {
  profile: Profile;
  user: User;
  onEdit: () => void;
}

export default function ProfileHeader({ profile, user, onEdit }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <CoverPhotoUpload currentCover={profile.coverPhoto} />

      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-12">
          
          <AvatarUpload
            currentAvatar={user.avatar}
            firstName={user.firstName}
            lastName={user.lastName}
          />

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