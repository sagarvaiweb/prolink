"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  useAddEducationMutation,
  useUpdateEducationMutation,
} from "@/redux/features/profile/profileApi";
import { Education, EducationPayload } from "@/types/profile.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editingEducation?: Education | null;
}

const emptyForm: EducationPayload = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
};

const toDateInputValue = (isoDate?: string) => (isoDate ? isoDate.split("T")[0] : "");

export default function EducationForm({ isOpen, onClose, editingEducation }: Props) {
  const [addEducation, { isLoading: isAdding }] = useAddEducationMutation();
  const [updateEducation, { isLoading: isUpdating }] = useUpdateEducationMutation();
  const isEditMode = Boolean(editingEducation);
  const isLoading = isAdding || isUpdating;

  const [formData, setFormData] = useState<EducationPayload>(emptyForm);

  useEffect(() => {
    if (editingEducation) {
      setFormData({
        school: editingEducation.school,
        degree: editingEducation.degree || "",
        fieldOfStudy: editingEducation.fieldOfStudy || "",
        startDate: toDateInputValue(editingEducation.startDate),
        endDate: toDateInputValue(editingEducation.endDate),
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editingEducation, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && editingEducation) {
        await updateEducation({ id: editingEducation._id, data: formData }).unwrap();
        toast.success("Education updated.");
      } else {
        await addEducation(formData).unwrap();
        toast.success("Education added.");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save education.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit education" : "Add education"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
          <input
            name="school"
            value={formData.school}
            onChange={handleChange}
            required
            placeholder="e.g. Far Western University"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
          <input
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            placeholder="e.g. Bachelor of Engineering"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Field of study</label>
          <input
            name="fieldOfStudy"
            value={formData.fieldOfStudy}
            onChange={handleChange}
            placeholder="e.g. Computer Engineering"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
            />
          </div>
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
              {isEditMode ? "Save changes" : "Add education"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}