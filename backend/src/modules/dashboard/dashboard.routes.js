import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import { jobIdParamsSchema } from "../job/job.validation.js";
import { dashboardRangeQuerySchema } from "./dashboard.validation.js";
import {
  getApplicationsSummary,
  getAdminPlatformStats,
  getNetworkGrowthStats,
  getPostEngagementStats,
  getProfileViewStats,
  getRecruiterJobFunnel,
  getRecruiterJobsOverview,
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
router.get(
  "/recruiter/:jobId/funnel",
  authorizeRole("recruiter"),
  validateParams(jobIdParamsSchema),
  getRecruiterJobFunnel
);
router.get(
  "/recruiter/jobs-overview",
  authorizeRole("recruiter"),
  getRecruiterJobsOverview
);
router.get(
  "/admin/platform-stats",
  authorizeRole("admin"),
  validateQuery(dashboardRangeQuerySchema),
  getAdminPlatformStats
);

export default router;
