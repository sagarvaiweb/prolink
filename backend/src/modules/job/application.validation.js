import Joi from "joi";
import ApiError from "../../utils/ApiError.js";

const objectId = Joi.string().hex().length(24).required();

export const applicationIdParamsSchema = Joi.object({
  applicationId: objectId,
});

export const applicantsParamsSchema = Joi.object({
  jobId: objectId,
});

export const applicationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string().valid("shortlisted", "rejected", "hired").required(),
}).unknown(false);

export const validateApplicationQuery = (req, _res, next) => {
  const { error, value } = applicationListQuerySchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw new ApiError(
      400,
      "Validation failed",
      error.details.map(({ message }) => message)
    );
  }

  req.validatedQuery = value;
  next();
};
