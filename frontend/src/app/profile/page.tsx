"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetMyProfileQuery } from "@/redux/features/profile/profileApi";
import { useAppSelector } from "@/redux/hooks";
import ProfileHeader from "@/components/profile/ProfileHeader";
import SkillsEditor from "@/components/profile/SkillsEditor";
import ExperienceList from "@/components/profile/ExperienceList";
import EducationList from "@/components/profile/EducationList";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ExperienceForm from "@/components/profile/ExperienceForm";
import EducationForm from "@/components/profile/EducationForm";
import { Experience , Education } from "@/types/profile.types";


export default function ProfilePage() {
  const { user } = useAppSelector((state) => state.auth);
  const { data, isLoading, isError } = useGetMyProfileQuery();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  const [isEducationFormOpen, setIsEducationFormOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);


  const openAddExperience = () => {
    setEditingExperience(null);
    setIsExperienceFormOpen(true);
  };

  const openEditExperience = (exp: Experience) => {
    setEditingExperience(exp);
    setIsExperienceFormOpen(true);
  };

  const openAddEducation = () => {
    setEditingEducation(null);
    setIsEducationFormOpen(true);
  };
  const openEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setIsEducationFormOpen(true);
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

              <EducationList
                education={data.data.education}
                onAdd={openAddEducation}
                onEdit={openEditEducation} />

              <SkillsEditor skills={data.data.skills} />

              <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                profile={data.data} />

              <ExperienceForm
                isOpen={isExperienceFormOpen}
                onClose={() => setIsExperienceFormOpen(false)}
                editingExperience={editingExperience} /> 

              <EducationForm
                isOpen={isEducationFormOpen}
                onClose={() => setIsEducationFormOpen(false)}
                editingEducation={editingEducation} /> 

            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}