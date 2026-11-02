import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import { uploadPostMedia } from "../../middlewares/upload.middleware.js";
import {
  createPost,
  deletePost,
  getFeed,
  getPostById,
  getPostsByUser,
  updatePost,
} from "./post.controller.js";
import {
  postAuthorParamsSchema,
  postIdParamsSchema,
  postListQuerySchema,
  validateCreatePost,
  validateUpdatePost,
} from "./post.validation.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post(
  "/",
  authenticateUser,
  rateLimiter,
  uploadPostMedia.array("media", 4),
  validateCreatePost,
  createPost
);
router.get(
  "/feed",
  authenticateUser,
  validateQuery(postListQuerySchema),
  getFeed
);
router.get(
  "/user/:userId",
  authenticateUser,
  validateParams(postAuthorParamsSchema),
  validateQuery(postListQuerySchema),
  getPostsByUser
);
router.get(
  "/:postId",
  authenticateUser,
  validateParams(postIdParamsSchema),
  getPostById
);
router.patch(
  "/:postId",
  authenticateUser,
  validateParams(postIdParamsSchema),
  uploadPostMedia.array("media", 4),
  validateUpdatePost,
  updatePost
);
router.delete(
  "/:postId",
  authenticateUser,
  validateParams(postIdParamsSchema),
  deletePost
);

export default router;
