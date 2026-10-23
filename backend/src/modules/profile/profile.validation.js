import Joi from "joi";

export const updateProfileSchema = Joi.object({
  headline: Joi.string().trim().max(100).allow(""),
  bio: Joi.string().trim().max(500).allow(""),
  location: Joi.string().trim().max(100).allow(""),
  visibility: Joi.string().valid("public", "connections", "private"),
}).min(1);

export const experienceSchema = Joi.object({
  title: Joi.string().trim().required().messages({ "string.empty": "Job title is required." }),
  company: Joi.string().trim().required().messages({ "string.empty": "Company is required." }),
  location: Joi.string().trim().allow(""),
  startDate: Joi.date().required().messages({ "any.required": "Start date is required." }),
  endDate: Joi.date().greater(Joi.ref("startDate")).allow(null).messages({
    "date.greater": "End date must be after start date.",
  }),
  isCurrent: Joi.boolean(),
  description: Joi.string().trim().allow(""),
});

export const updateSkillsSchema = Joi.object({
  skills: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(50)
    .required()
    .messages({
      "array.max": "You can have at most 50 skills.",
      "string.max": "Each skill must be under 30 characters.",
    }),
});

export const educationSchema = Joi.object({
  school: Joi.string().trim().required().messages({ "string.empty": "School is required." }),
  degree: Joi.string().trim().allow(""),
  fieldOfStudy: Joi.string().trim().allow(""),
  startDate: Joi.date().required().messages({ "any.required": "Start date is required." }),
  endDate: Joi.date().allow(null),
});

