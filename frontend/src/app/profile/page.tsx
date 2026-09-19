"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetMyProfileQuery } from "@/redux/features/profile/profileApi";
import { useAppSelector } from "@/redux/hooks";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SkillsEditor from "@/components/profile/SkillsEditor";
import ExperienceList from "@/components/profile/ExperienceList";
import EditProfileModal from "@/components/profile/EditProfileModal";

export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, isError } = useGetMyProfileQuery();
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {isLoading && <p className="text-center text-gray-400">Loading profile...</p>}
          {isError && <p className="text-center text-red-500">Failed to load profile.</p>}

          {data && user && (
            <>
              <ProfileHeader profile={data.data} user={user} onEdit={() => setIsEditOpen(true)} />
              <ExperienceList experience={data.data.experience} onAdd={() => {}} onEdit={() => {}} />
              <SkillsEditor skills={data.data.skills} />

              <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                profile={data.data}
              />
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}