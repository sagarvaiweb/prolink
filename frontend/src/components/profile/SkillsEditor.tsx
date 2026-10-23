"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useUpdateSkillsMutation } from "@/redux/features/profile/profileApi";

export default function SkillsEditor({ skills }: { skills: string[] }) {
  const [updateSkills, { isLoading }] = useUpdateSkillsMutation();
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = async () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.error("That skill is already on your profile.");
      return;
    }
    try {
      await updateSkills({ skills: [...skills, trimmed] }).unwrap();
      setNewSkill("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add skill.");
    }
  };

  const handleRemove = async (skill: string) => {
    try {
      await updateSkills({ skills: skills.filter((s) => s !== skill) }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove skill.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet.</p>}
        {skills.map((skill) => (
          <span
            key={skill}
            className="flex items-center gap-1.5 bg-primary-50 text-primary-800 text-sm font-medium px-3 py-1.5 rounded-full"
          >
            {skill}
            <button onClick={() => handleRemove(skill)} className="hover:text-red-600">
              <X size={13} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder="Add a skill (e.g. React, Figma)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
        />
        <button
          onClick={handleAdd}
          disabled={isLoading}
          className="flex items-center gap-1 bg-primary-800 text-white text-sm font-medium px-4 rounded-lg hover:bg-primary-900 disabled:opacity-60"
        >
          <Plus size={16} />
          Add
        </button>
      </div>
    </div>
  );
}