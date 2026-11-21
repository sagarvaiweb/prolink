import Joi from "joi";

export const recentSearchListQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(10).default(10),
}).unknown(false);

export const recentSearchParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID must be a valid ObjectId.",
    "string.length": "ID must be a valid ObjectId.",
  }),
});
