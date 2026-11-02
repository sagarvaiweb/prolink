"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { useGetProfileByUserIdQuery } from "@/redux/features/profile/profileApi";
import PublicProfileHeader from "@/components/profile/PublicProfileHeader";
import PublicExperienceList from "@/components/profile/PublicExperienceList";
import PublicEducationList from "@/components/profile/PublicEducationList";
import PublicSkillsList from "@/components/profile/PublicSkillsList";
import ProfileNetworkPanel from "@/components/network/ProfileNetworkPanel";
import ProfilePostsSection from "@/components/posts/ProfilePostsSection";
import { useAppSelector } from "@/redux/hooks";
import { Lock, FileX } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const currentUserId = useAppSelector(
    (state) => state.auth.user?._id ?? ""
  );

  const { data, isLoading, error } = useGetProfileByUserIdQuery(userId);

  // RTK Query's error object shape for a failed fetchBaseQuery request
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {isLoading && <p className="text-center text-gray-400">Loading profile...</p>}

          {status === 403 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
              <Lock size={32} className="text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900">This profile is private</h2>
              <p className="text-sm text-gray-500 mt-1">
                The owner has restricted who can view this profile.
              </p>
            </div>
          )}

          {status === 404 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center text-center">
              <FileX size={32} className="text-gray-300 mb-3" />
              <h2 className="text-lg font-semibold text-gray-900">Profile not found</h2>
              <p className="text-sm text-gray-500 mt-1">
                This user does not have a profile yet, or the link is incorrect.
              </p>
            </div>
          )}

          {data && (
            <>
              <PublicProfileHeader profile={data.data} user={data.data.user} />
              <ProfileNetworkPanel userId={data.data.user._id} />
              <ProfilePostsSection
                userId={data.data.user._id}
                currentUserId={currentUserId}
              />
              <PublicExperienceList experience={data.data.experience} />
              <PublicEducationList education={data.data.education} />
              <PublicSkillsList skills={data.data.skills} />
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}