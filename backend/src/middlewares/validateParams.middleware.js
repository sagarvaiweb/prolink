import ApiError from "../utils/ApiError.js";

const validateParams = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.params, { abortEarly: false });

  if (error) {
    throw new ApiError(
      400,
      "Validation failed",
      error.details.map((item) => item.message)
    );
  }

  next();
};

export default validateParams;
