import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import { uploadPostMedia } from "../../middlewares/upload.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import {
  addComment,
  deleteComment,
  getCommentReplies,
  getComments,
  likePost,
  unlikePost,
  updateComment,
} from "./engagement.controller.js";
import {
  getSavedPosts,
  savePost,
  sharePost,
  unsavePost,
} from "./sharing.controller.js";
import {
  getPostReports,
  reportPost,
  reviewPostReport,
} from "./report.controller.js";
import {
  createPost,
  deletePost,
  getFeed,
  getPostById,
  getPostsByUser,
  updatePost,
} from "./post.controller.js";
import {
  commentIdParamsSchema,
  createCommentSchema,
  postAuthorParamsSchema,
  postCommentParamsSchema,
  postIdParamsSchema,
  postListQuerySchema,
  postReportParamsSchema,
  reportPostSchema,
  reviewPostReportSchema,
  sharePostSchema,
  updateCommentSchema,
  validateCreatePost,
  validateUpdatePost,
} from "./post.validation.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = Router();

router.get(
  "/saved",
  authenticateUser,
  validateQuery(postListQuerySchema),
  getSavedPosts
);
router.get(
  "/reports",
  authenticateUser,
  authorizeRole("admin"),
  validateQuery(postListQuerySchema),
  getPostReports
);
router.patch(
  "/reports/:reportId",
  authenticateUser,
  authorizeRole("admin"),
  validateParams(postReportParamsSchema),
  validateRequest(reviewPostReportSchema),
  reviewPostReport
);
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
router.post(
  "/:postId/share",
  authenticateUser,
  validateParams(postIdParamsSchema),
  validateRequest(sharePostSchema),
  sharePost
);
router.post(
  "/:postId/save",
  authenticateUser,
  validateParams(postIdParamsSchema),
  savePost
);
router.delete(
  "/:postId/save",
  authenticateUser,
  validateParams(postIdParamsSchema),
  unsavePost
);
router.post(
  "/:postId/report",
  authenticateUser,
  rateLimiter,
  validateParams(postIdParamsSchema),
  validateRequest(reportPostSchema),
  reportPost
);
router.post(
  "/:postId/like",
  authenticateUser,
  validateParams(postIdParamsSchema),
  likePost
);
router.delete(
  "/:postId/like",
  authenticateUser,
  validateParams(postIdParamsSchema),
  unlikePost
);
router.post(
  "/:postId/comments",
  authenticateUser,
  validateParams(postIdParamsSchema),
  validateRequest(createCommentSchema),
  addComment
);
router.get(
  "/:postId/comments",
  authenticateUser,
  validateParams(postIdParamsSchema),
  validateQuery(postListQuerySchema),
  getComments
);
router.get(
  "/:postId/comments/:commentId/replies",
  authenticateUser,
  validateParams(postCommentParamsSchema),
  validateQuery(postListQuerySchema),
  getCommentReplies
);
router.patch(
  "/comments/:commentId",
  authenticateUser,
  validateParams(commentIdParamsSchema),
  validateRequest(updateCommentSchema),
  updateComment
);
router.delete(
  "/comments/:commentId",
  authenticateUser,
  validateParams(commentIdParamsSchema),
  deleteComment
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
