"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetMyProfileQuery } from "@/redux/features/profile/profileApi";
import { useAppSelector } from "@/redux/hooks";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SkillsEditor from "@/components/profile/SkillsEditor";
import ExperienceList from "@/components/profile/ExperienceList";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ExperienceForm from "@/components/profile/ExperienceForm";
import { Experience } from "@/types/profile.types";


export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, isError } = useGetMyProfileQuery();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  const openAddExperience = () => {
    setEditingExperience(null);
    setIsExperienceFormOpen(true);
  };

  const openEditExperience = (exp: Experience) => {
    setEditingExperience(exp);
    setIsExperienceFormOpen(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {isLoading && <p className="text-center text-gray-400">Loading profile...</p>}
          {isError && <p className="text-center text-red-500">Failed to load profile.</p>}

          {data && user && (
            <>
              <ProfileHeader profile={data.data} user={user} onEdit={() => setIsEditOpen(true)} />
              <ExperienceList
                experience={data.data.experience}
                onAdd={openAddExperience}
                onEdit={openEditExperience} />  

              <SkillsEditor skills={data.data.skills} />

              <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                profile={data.data} />

              <ExperienceForm
                isOpen={isExperienceFormOpen}
                onClose={() => setIsExperienceFormOpen(false)}
                editingExperience={editingExperience} />  
                
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}