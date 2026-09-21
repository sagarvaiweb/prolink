"use client";

import { useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useUpdateProfileMutation } from "@/redux/features/profile/profileApi";
import { Profile, UpdateProfilePayload } from "@/types/profile.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export default function EditProfileModal({ isOpen, onClose, profile }: Props) {
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [formData, setFormData] = useState<UpdateProfilePayload>({
    headline: profile.headline || "",
    bio: profile.bio || "",
    location: profile.location || "",
    visibility: profile.visibility,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData).unwrap();
      toast.success("Profile updated successfully.");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
          <input
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            maxLength={100}
            placeholder="e.g. Full-Stack Developer | MERN & AI/ML"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={500}
            rows={4}
            placeholder="Tell people about yourself..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{formData.bio?.length || 0}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Mahendranagar, Nepal"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <option value="public">Public — anyone can view</option>
            <option value="connections">Connections only</option>
            <option value="private">Private — only you</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 font-medium transition-colors"
          >
            Cancel
          </button>
          <div className="flex-1">
            <Button type="submit" isLoading={isLoading}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}