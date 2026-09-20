"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useUploadCoverPhotoMutation } from "@/redux/features/profile/profileApi";

interface Props {
  currentCover?: string;
}

const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export default function CoverPhotoUpload({ currentCover }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadCover, { isLoading }] = useUploadCoverPhotoMutation();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG/PNG files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File exceeds maximum allowed size (${MAX_SIZE_MB}MB).`);
      return;
    }

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    // "cover" key MUST match: uploadPhoto.single("cover")
    formData.append("cover", file);

    try {
      await uploadCover(formData).unwrap();
      toast.success("Cover photo updated.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload cover photo.");
      setPreview(null);
    }
  };

  const displayImage = preview || currentCover;

  return (
    <div
      className="h-32 relative group cursor-pointer"
      style={{
        backgroundImage: displayImage ? `url(${displayImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={() => inputRef.current?.click()}
    >
      {!displayImage && (
        <div className="w-full h-full bg-linear-to-r from-primary-900 to-primary-700" />
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-white text-sm font-medium transition-opacity">
          <Camera size={16} />
          {isLoading ? "Uploading..." : "Change cover"}
        </span>
      </div>

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