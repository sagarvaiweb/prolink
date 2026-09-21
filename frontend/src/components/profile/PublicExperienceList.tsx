import { Briefcase } from "lucide-react";
import { Experience } from "@/types/profile.types";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present";

export default function PublicExperienceList({ experience }: { experience: Experience[] }) {
  if (experience.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
      <div className="space-y-5">
        {experience.map((exp) => (
          <div key={exp._id} className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <Briefcase size={18} className="text-primary-800" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{exp.title}</p>
              <p className="text-sm text-gray-600">{exp.company}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                {exp.location && ` · ${exp.location}`}
              </p>
              {exp.description && <p className="text-sm text-gray-600 mt-2">{exp.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}