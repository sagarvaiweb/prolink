import Joi from "joi";
import ApiError from "../../utils/ApiError.js";

const objectId = Joi.string().hex().length(24).required();

export const notificationIdParamsSchema = Joi.object({
  notificationId: objectId,
});

export const notificationListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  unreadOnly: Joi.boolean().default(false),
});

export const validateNotificationQuery = (req, _res, next) => {
  const { error, value } = notificationListQuerySchema.validate(req.query, {
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

  req.query = value;
  next();
};
