import Joi from "joi";

const ENTITY_TYPES = ["people", "jobs", "posts", "companies"];
const USER_ROLES = ["student", "professional", "recruiter", "admin"];
const EXPERIENCE_LEVELS = ["entry", "mid", "senior"];
const EMPLOYMENT_TYPES = ["full-time", "part-time", "internship", "contract"];

const parseTypes = (value, helpers) => {
  const types = value.split(",").map((type) => type.trim().toLowerCase());

  if (
    !types.length ||
    types.some((type) => !["all", ...ENTITY_TYPES].includes(type)) ||
    new Set(types).size !== types.length ||
    (types.includes("all") && types.length !== 1)
  ) {
    return helpers.error("any.invalid");
  }

  return types.includes("all") ? "all" : types.join(",");
};

const parseSkills = (value, helpers) => {
  const skills = value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (
    !skills.length ||
    skills.length > 20 ||
    skills.some((skill) => skill.length > 50)
  ) {
    return helpers.error("any.invalid");
  }

  return [...new Set(skills.map((skill) => skill.toLowerCase()))];
};

export const searchQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .replace(/\s+/g, " ")
    .min(1)
    .max(100)
    .required()
    .messages({
      "string.empty": "Please enter a search term.",
      "any.required": "Please enter a search term.",
    }),
  type: Joi.string().trim().default("all").custom(parseTypes),
  mode: Joi.string().valid("keyword", "semantic", "hybrid").default("hybrid"),
  sort: Joi.string().valid("relevance").default("relevance"),
  page: Joi.number().integer().min(1).max(100).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  location: Joi.string().trim().min(1).max(150),
  skills: Joi.string().trim().max(1000).custom(parseSkills),
  role: Joi.string().valid(...USER_ROLES),
  title: Joi.string().trim().min(1).max(120),
  experienceLevel: Joi.string().valid(...EXPERIENCE_LEVELS),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
  salaryRange: Joi.string().trim().min(1).max(100),
  industry: Joi.string().trim().min(1).max(100),
  author: Joi.string().hex().length(24),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  visibility: Joi.string().valid("public"),
})
  .custom((query, helpers) => {
    if (
      query.dateFrom &&
      query.dateTo &&
      query.dateFrom.getTime() > query.dateTo.getTime()
    ) {
      return helpers.error("any.invalid");
    }

    const selectedTypes =
      query.type === "all" ? ENTITY_TYPES : query.type.split(",");
    const categoryFilters = {
      role: ["people"],
      title: ["people"],
      location: ["people", "jobs", "companies"],
      skills: ["people", "jobs"],
      experienceLevel: ["jobs"],
      employmentType: ["jobs"],
      salaryRange: ["jobs"],
      industry: ["jobs", "companies"],
      author: ["posts"],
      dateFrom: ["posts"],
      dateTo: ["posts"],
      visibility: ["posts"],
    };

    for (const [filter, supportedTypes] of Object.entries(categoryFilters)) {
      if (
        query[filter] !== undefined &&
        selectedTypes.length === 1 &&
        !supportedTypes.includes(selectedTypes[0])
      ) {
        return helpers.error("any.invalid");
      }
    }

    return query;
  })
  .unknown(false);
