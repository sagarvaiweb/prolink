import Joi from "joi";
import ApiError from "../../utils/ApiError.js";

const objectId = Joi.string().hex().length(24).required();

const companyFields = {
  name: Joi.string().trim().min(2).max(120),
  logo: Joi.string().uri({ scheme: ["http", "https"] }).allow("", null),
  description: Joi.string().trim().max(1000).allow(""),
  industry: Joi.string().trim().max(100).allow(""),
  companySize: Joi.string().valid("1-10", "11-50", "51-200", "201-1000", "1000+"),
  website: Joi.string().uri({ scheme: ["http", "https"] }).allow("", null),
  location: Joi.string().trim().max(150).allow(""),
};

export const companyIdParamsSchema = Joi.object({ companyId: objectId });
export const companyMemberParamsSchema = Joi.object({
  companyId: objectId,
  userId: objectId,
});

export const addCompanyMemberSchema = Joi.object({
  userId: objectId,
  role: Joi.string().valid("admin", "recruiter").default("recruiter"),
}).unknown(false);

export const companyMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
}).unknown(false);

export const companyJobsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
}).unknown(false);

export const createCompanySchema = Joi.object({
  ...companyFields,
  name: companyFields.name.required(),
}).unknown(false);

export const updateCompanySchema = Joi.object(companyFields)
  .min(1)
  .unknown(false);

export const companyListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(100000).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  search: Joi.string().trim().max(100),
  industry: Joi.string().trim().max(100),
  companySize: companyFields.companySize,
}).unknown(false);

export const validateCompanyBody = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
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

  req.body = value;
  next();
};

export const validateCompanyQuery = (req, _res, next) => {
  const { error, value } = companyListQuerySchema.validate(req.query, {
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

export const validateCompanyMembersQuery = (req, _res, next) => {
  const { error, value } = companyMembersQuerySchema.validate(req.query, {
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

export const validateCompanyJobsQuery = (req, _res, next) => {
  const { error, value } = companyJobsQuerySchema.validate(req.query, {
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
