"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  useAddExperienceMutation,
  useUpdateExperienceMutation,
} from "@/redux/features/profile/profileApi";
import { Experience, ExperiencePayload } from "@/types/profile.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // If editingExperience is provided, form runs in EDIT mode; otherwise ADD mode
  editingExperience?: Experience | null;
}

const emptyForm: ExperiencePayload = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
};

// Converts an ISO date string (from backend) into "YYYY-MM-DD" for <input type="date">
const toDateInputValue = (isoDate?: string) => (isoDate ? isoDate.split("T")[0] : "");

export default function ExperienceForm({ isOpen, onClose, editingExperience }: Props) {
  const [addExperience, { isLoading: isAdding }] = useAddExperienceMutation();
  const [updateExperience, { isLoading: isUpdating }] = useUpdateExperienceMutation();
  const isEditMode = Boolean(editingExperience);
  const isLoading = isAdding || isUpdating;

  const [formData, setFormData] = useState<ExperiencePayload>(emptyForm);

  // Whenever the modal opens for a different experience (or a fresh "add"),
  // reset the form to match , otherwise it would keep stale data from before
  useEffect(() => {
    if (editingExperience) {
      setFormData({
        title: editingExperience.title,
        company: editingExperience.company,
        location: editingExperience.location || "",
        startDate: toDateInputValue(editingExperience.startDate),
        endDate: toDateInputValue(editingExperience.endDate),
        isCurrent: editingExperience.isCurrent,
        description: editingExperience.description || "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editingExperience, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If "currently working here" is checked, don't send an endDate at all
    const payload: ExperiencePayload = {
      ...formData,
      endDate: formData.isCurrent ? undefined : formData.endDate,
    };

    try {
      if (isEditMode && editingExperience) {
        await updateExperience({ id: editingExperience._id, data: payload }).unwrap();
        toast.success("Experience updated.");
      } else {
        await addExperience(payload).unwrap();
        toast.success("Experience added.");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save experience.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit experience" : "Add experience"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g. Backend Developer Intern"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            placeholder="e.g. ProLink"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              disabled={formData.isCurrent}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            name="isCurrent"
            checked={formData.isCurrent}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-800 focus:ring-primary-700"
          />
          I currently work here
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="What did you work on?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700 resize-none"
          />
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
              {isEditMode ? "Save changes" : "Add experience"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}