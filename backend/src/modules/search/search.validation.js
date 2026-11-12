import Joi from "joi";
import ApiError from "../../utils/ApiError.js";

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(300).required(),
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
}).unknown(false);

export const validateSearchQuery = (req, _res, next) => {
  const { error, value } = searchQuerySchema.validate(req.query, { abortEarly: false, convert: true });
  if (error) throw new ApiError(400, "Validation failed", error.details.map(({ message }) => message));
  req.validatedQuery = value;
  next();
};
