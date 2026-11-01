import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from "./follow.controller.js";
import {
  followListQuerySchema,
  followUserParamsSchema,
} from "./follow.validation.js";

const router = Router();

router.get(
  "/followers/:userId",
  authenticateUser,
  validateParams(followUserParamsSchema),
  validateQuery(followListQuerySchema),
  getFollowers
);
router.get(
  "/following/:userId",
  authenticateUser,
  validateParams(followUserParamsSchema),
  validateQuery(followListQuerySchema),
  getFollowing
);
router.post(
  "/:userId",
  authenticateUser,
  validateParams(followUserParamsSchema),
  followUser
);
router.delete(
  "/:userId",
  authenticateUser,
  validateParams(followUserParamsSchema),
  unfollowUser
);

export default router;
