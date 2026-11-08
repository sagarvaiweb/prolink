import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import { dashboardRangeQuerySchema } from "./dashboard.validation.js";
import {
  getApplicationsSummary,
  getNetworkGrowthStats,
  getPostEngagementStats,
  getProfileViewStats,
} from "./dashboard.controller.js";

const router = Router();
router.use(authenticateUser);
router.get(
  "/profile-views",
  validateQuery(dashboardRangeQuerySchema),
  getProfileViewStats
);
router.get(
  "/post-engagement",
  validateQuery(dashboardRangeQuerySchema),
  getPostEngagementStats
);
router.get(
  "/network-growth",
  validateQuery(dashboardRangeQuerySchema),
  getNetworkGrowthStats
);
router.get(
  "/applications-summary",
  validateQuery(dashboardRangeQuerySchema),
  getApplicationsSummary
);

export default router;
