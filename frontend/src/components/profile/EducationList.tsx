"use client";

import { GraduationCap, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Education } from "@/types/profile.types";
import { useDeleteEducationMutation } from "@/redux/features/profile/profileApi";

interface Props {
  education: Education[];
  onAdd: () => void;
  onEdit: (edu: Education) => void;
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present";

export default function EducationList({ education, onAdd, onEdit }: Props) {
  const [deleteEducation] = useDeleteEducationMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteEducation(id).unwrap();
      toast.success("Education removed.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove education.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Education</h2>
        <button onClick={onAdd} className="text-primary-800 hover:text-primary-900">
          <Plus size={20} />
        </button>
      </div>

      {education.length === 0 && <p className="text-sm text-gray-400">No education added yet.</p>}

      <div className="space-y-5">
        {education.map((edu) => (
          <div key={edu._id} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <GraduationCap size={18} className="text-primary-800" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{edu.school}</p>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <p className="text-sm text-gray-600">
                      {edu.degree}
                      {edu.degree && edu.fieldOfStudy && ", "}
                      {edu.fieldOfStudy}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                  </p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(edu)} className="text-gray-400 hover:text-primary-800">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(edu._id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}