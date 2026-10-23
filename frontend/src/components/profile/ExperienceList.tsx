"use client";

import { Briefcase, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Experience } from "@/types/profile.types";
import { useDeleteExperienceMutation } from "@/redux/features/profile/profileApi";

interface Props {
  experience: Experience[];
  onAdd: () => void;
  onEdit: (exp: Experience) => void;
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present";

export default function ExperienceList({ experience, onAdd, onEdit }: Props) {
  const [deleteExperience] = useDeleteExperienceMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteExperience(id).unwrap();
      toast.success("Experience removed.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove experience.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
        <button onClick={onAdd} className="text-primary-800 hover:text-primary-900">
          <Plus size={20} />
        </button>
      </div>

      {experience.length === 0 && <p className="text-sm text-gray-400">No experience added yet.</p>}

      <div className="space-y-5">
        {experience.map((exp) => (
          <div key={exp._id} className="flex gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Briefcase size={18} className="text-primary-800" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{exp.title}</p>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(exp)} className="text-gray-400 hover:text-primary-800">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(exp._id)} className="text-gray-400 hover:text-red-600">
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