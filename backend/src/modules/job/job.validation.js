import Joi from "joi";
import ApiError from "../../utils/ApiError.js";

const objectId = Joi.string().hex().length(24).required();
const jobFields = {
  title: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().min(1).max(20000),
  requiredSkills: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .min(1)
    .max(20)
    .unique((a, b) => a.toLowerCase() === b.toLowerCase()),
  experienceLevel: Joi.string().valid("entry", "mid", "senior"),
  jobType: Joi.string().valid("full-time", "part-time", "internship", "contract"),
  location: Joi.string().trim().min(1).max(120),
  isRemote: Joi.boolean(),
  salaryRange: Joi.string().trim().max(100).allow("", null),
};

export const jobIdParamsSchema = Joi.object({ jobId: objectId });
export const moderationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
export const moderationParamsSchema = Joi.object({ jobId: objectId });
export const moderationReviewSchema = Joi.object({
  decision: Joi.string().valid("approve", "reject").required(),
  note: Joi.string().trim().max(500).allow("").when("decision", {
    is: "reject",
    then: Joi.string().trim().min(1).max(500).required(),
    otherwise: Joi.string().trim().max(500).allow(""),
  }),
}).unknown(false);

export const createJobSchema = Joi.object(jobFields).fork(
  ["title", "description", "requiredSkills", "experienceLevel", "jobType", "location"],
  (schema) => schema.required()
).unknown(false);

export const updateJobSchema = Joi.object(jobFields)
  .min(1)
  .unknown(false);

export const jobListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().trim().max(100),
  location: Joi.string().trim().max(120),
  experienceLevel: jobFields.experienceLevel,
  jobType: jobFields.jobType,
  isRemote: Joi.boolean(),
  skills: Joi.alternatives().try(
    Joi.string().trim().max(500),
    Joi.array().items(Joi.string().trim().min(1).max(50)).max(20)
  ),
  status: Joi.string().valid("open", "closed").default("open"),
});

export const validateJobBody = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    throw new ApiError(400, "Validation failed", error.details.map(({ message }) => message));
  }
  req.body = value;
  next();
};

export const validateJobQuery = (req, _res, next) => {
  const { error, value } = jobListQuerySchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  });
  if (error) {
    throw new ApiError(400, "Validation failed", error.details.map(({ message }) => message));
  }
  req.query = value;
  next();
};
