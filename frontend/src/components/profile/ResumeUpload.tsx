"use client";

import { useRef } from "react";
import { FileText, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useUploadResumeMutation } from "@/redux/features/profile/profileApi";

interface Props {
  currentResumeUrl?: string;
}

const MAX_SIZE_MB = 5;

export default function ResumeUpload({ currentResumeUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadResume, { isLoading }] = useUploadResumeMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File exceeds maximum allowed size (${MAX_SIZE_MB}MB).`);
      return;
    }

    const formData = new FormData();
    // "resume" key MUST match: uploadResumeMiddleware.single("resume")
    formData.append("resume", file);

    try {
      await uploadResume(formData).unwrap();
      toast.success("Resume uploaded successfully.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload resume.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resume</h2>

      {currentResumeUrl ? (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-primary-800" />
            <span className="text-sm font-medium text-gray-700">Current resume</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={currentResumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary-800 hover:underline">
                
              View <ExternalLink size={13} />
            </a>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-60"
            >
              {isLoading ? "Uploading..." : "Replace"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-8 text-gray-400 hover:border-primary-700 hover:text-primary-700 transition-colors disabled:opacity-60"
        >
          <Upload size={24} />
          <span className="text-sm font-medium">
            {isLoading ? "Uploading..." : "Upload your resume (PDF, max 5MB)"}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}