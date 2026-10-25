import Joi from "joi";

export const followUserParamsSchema = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    "string.hex": "ID must be a valid ObjectId",
    "string.length": "ID must be a valid ObjectId",
  }),
});

export const followListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});
