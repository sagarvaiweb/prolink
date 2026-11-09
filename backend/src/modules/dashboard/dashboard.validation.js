import Joi from "joi";

export const dashboardRangeQuerySchema = Joi.object({
  range: Joi.string().valid("7d", "30d", "90d", "all").default("30d"),
}).unknown(false);
