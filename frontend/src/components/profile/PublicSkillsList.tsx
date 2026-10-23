export default function PublicSkillsList({ skills }: { skills: string[] }) {
  if (skills.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="bg-primary-50 text-primary-800 text-sm font-medium px-3 py-1.5 rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}