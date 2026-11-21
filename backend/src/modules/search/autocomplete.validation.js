import Joi from "joi";

const AUTOCOMPLETE_TYPES = ["people", "jobs", "companies"];

const parseTypes = (value, helpers) => {
  const types = value.split(",").map((type) => type.trim());

  if (
    !types.length ||
    types.some((type) => !["all", ...AUTOCOMPLETE_TYPES].includes(type)) ||
    new Set(types).size !== types.length ||
    (types.includes("all") && types.length !== 1)
  ) {
    return helpers.error("any.invalid");
  }

  return types.includes("all") ? "all" : types.join(",");
};

export const autocompleteQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .replace(/\s+/g, " ")
    .min(2)
    .max(80)
    .required()
    .messages({
      "string.empty": "Please enter at least two characters.",
      "string.min": "Please enter at least two characters.",
      "any.required": "Please enter at least two characters.",
    }),
  type: Joi.string()
    .trim()
    .lowercase()
    .default("all")
    .custom(parseTypes),
  limit: Joi.number().integer().min(1).max(10).default(8),
}).unknown(false);
