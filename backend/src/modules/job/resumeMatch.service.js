const normalizeSkills = (skills = []) =>
  new Set(
    (skills ?? []).map((skill) => skill.trim().toLocaleLowerCase())
  );

// Keep this response contract stable when replacing the local scorer with ML.
export const getResumeMatchScore = async ({ profile, job }) => {
  const applicantSkills = normalizeSkills(profile.skills);
  const requiredSkills = job.requiredSkills ?? [];
  const matchedSkills = requiredSkills.filter((skill) =>
    applicantSkills.has(skill.trim().toLocaleLowerCase())
  );

  return {
    matchScore: requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0,
    missingSkills: requiredSkills.filter(
      (skill) => !applicantSkills.has(skill.trim().toLocaleLowerCase())
    ),
  };
};
