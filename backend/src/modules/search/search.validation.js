import Joi from "joi";
import mongoose from "mongoose";
import ApiError from "../../utils/ApiError.js";

const schema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string().valid("people", "jobs", "posts", "companies", "all").default("all"),
  mode: Joi.string().valid("keyword", "smart").default("keyword"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  role: Joi.string().valid("student", "professional", "recruiter", "admin"),
  location: Joi.string().trim().max(120),
  jobType: Joi.string().valid("full-time", "part-time", "internship", "contract"),
  experienceLevel: Joi.string().valid("entry", "mid", "senior"),
  industry: Joi.string().trim().max(100),
}).unknown(false);

export const validateSearchQuery = (req, _res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, convert: true });
  if (error) throw new ApiError(400, "Invalid search parameters.", error.details.map(({ message }) => message));
  req.validatedQuery = value;
  next();
};

export const validateAutocompleteQuery = (req, _res, next) => {
  const { error, value } = Joi.object({ q: Joi.string().trim().min(1).max(100).required() }).validate(req.query, { abortEarly: false });
  if (error) throw new ApiError(400, "Please enter a search term.");
  req.validatedQuery = value;
  next();
};

export const validateRecentSearchId = (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, "Invalid recent search id.");
  next();
};
