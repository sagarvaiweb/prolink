import { GraduationCap } from "lucide-react";
import { Education } from "@/types/profile.types";

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Present";

export default function PublicEducationList({ education }: { education: Education[] }) {
  if (education.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Education</h2>
      <div className="space-y-5">
        {education.map((edu) => (
          <div key={edu._id} className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
              <GraduationCap size={18} className="text-primary-800" />
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}