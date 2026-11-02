import Joi from "joi";
import ApiError from "../../utils/ApiError.js";
import { cleanupUploadedPostMedia } from "../../utils/postMedia.util.js";

const objectId = Joi.string().hex().length(24).required().messages({
  "string.hex": "ID must be a valid ObjectId",
  "string.length": "ID must be a valid ObjectId",
});

const visibility = Joi.string().valid("public", "connections");

export const postIdParamsSchema = Joi.object({
  postId: objectId,
});

export const postAuthorParamsSchema = Joi.object({
  userId: objectId,
});

export const commentIdParamsSchema = Joi.object({
  commentId: objectId,
});

export const postCommentParamsSchema = Joi.object({
  postId: objectId,
  commentId: objectId,
});

export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  parentComment: Joi.string().hex().length(24).allow(null),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
});

export const createPostSchema = Joi.object({
  content: Joi.string().trim().max(3000).allow("").default(""),
  visibility: visibility.default("public"),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().trim().max(3000).allow(""),
  visibility,
  clearMedia: Joi.boolean().valid(true),
});

export const postListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const validatePostBody = (schema, req) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    throw new ApiError(
      400,
      "Validation failed",
      error.details.map((item) => item.message)
    );
  }
  return value;
};

export const validateCreatePost = async (req, _res, next) => {
  let value;
  try {
    value = validatePostBody(createPostSchema, req);
  } catch (error) {
    try {
      await cleanupUploadedPostMedia(req.files);
    } catch (cleanupError) {
      console.error("Failed to clean up invalid post uploads.", cleanupError);
    }
    return next(error);
  }

  if (!value.content && !req.files?.length) {
    return next(
      new ApiError(400, "A post must include text or at least one image.")
    );
  }

  req.body = value;
  return next();
};

export const validateUpdatePost = async (req, _res, next) => {
  let value;
  try {
    value = validatePostBody(updatePostSchema, req);
    if (!Object.keys(value).length && !req.files?.length) {
      throw new ApiError(400, "Provide at least one post field to update.");
    }
  } catch (error) {
    try {
      await cleanupUploadedPostMedia(req.files);
    } catch (cleanupError) {
      console.error("Failed to clean up invalid post uploads.", cleanupError);
    }
    return next(error);
  }

  req.body = value;
  return next();
};
