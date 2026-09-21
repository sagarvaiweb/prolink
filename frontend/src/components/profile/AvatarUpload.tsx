"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useUploadProfilePhotoMutation } from "@/redux/features/profile/profileApi";
import { authApi } from "@/redux/features/auth/authApi";
import { useAppDispatch } from "@/redux/hooks";


interface Props {
  currentAvatar?: string;
  firstName: string;
  lastName: string;
}

const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export default function AvatarUpload({ currentAvatar, firstName, lastName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadPhoto, { isLoading }] = useUploadProfilePhotoMutation();
  const [preview, setPreview] = useState<string | null>(null);

  const dispatch = useAppDispatch();


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation — mirrors backend rules for instant feedback
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG/PNG files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File exceeds maximum allowed size (${MAX_SIZE_MB}MB).`);
      return;
    }

    // Show an instant local preview while the upload is in progress
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    // "avatar" key MUST match your backend route:
    // uploadPhoto.single("avatar")
    formData.append("avatar", file);

    try {
      await uploadPhoto(formData).unwrap();
      dispatch(authApi.util.invalidateTags(["User"]));
      toast.success("Profile photo updated.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload photo.");
      setPreview(null);
    }
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className="relative w-24 h-24">
      <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-800 text-white text-2xl font-bold">
            {firstName[0]}
            {lastName[0]}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-800 text-white flex items-center justify-center border-2 border-white hover:bg-primary-900 disabled:opacity-60 transition-colors"
        aria-label="Change profile photo"
      >
        <Camera size={14} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}