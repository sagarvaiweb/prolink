import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  getPostReports,
  reviewPostReport,
} from "../post/report.controller.js";
import {
  getCompaniesForVerification,
  reviewCompanyVerification,
  suspendCompany,
} from "../company/company.controller.js";
import {
  companyIdParamsSchema,
  validateCompanyQuery,
} from "../company/company.validation.js";
import {
  getAdminUsers,
  getUserById,
  updateAccountStatus,
  updateUser,
} from "../user/user.controller.js";
import { removeJobByAdmin } from "../job/job.controller.js";
import { jobIdParamsSchema } from "../job/job.validation.js";
import { getAdminPlatformStats } from "../dashboard/dashboard.controller.js";
import { dashboardRangeQuerySchema } from "../dashboard/dashboard.validation.js";
import { getActionLogs } from "./admin.controller.js";
import {
  adminActionLogsQuerySchema,
  adminCompanyReviewSchema,
  adminJobRemovalSchema,
  adminReportActionSchema,
  adminReportParamsSchema,
  adminReportsQuerySchema,
  adminUserParamsSchema,
  adminUserRoleSchema,
  adminUsersQuerySchema,
  adminUserStatusSchema,
} from "./admin.validation.js";

const router = Router();

router.use(authenticateUser, authorizeRole("admin"));

router.get("/reports", validateQuery(adminReportsQuerySchema), getPostReports);
router.patch(
  "/reports/:reportId/action",
  validateParams(adminReportParamsSchema),
  validateRequest(adminReportActionSchema),
  reviewPostReport
);

router.get("/companies/pending", validateCompanyQuery, getCompaniesForVerification);
router.patch(
  "/companies/:companyId/verification",
  validateParams(companyIdParamsSchema),
  validateRequest(adminCompanyReviewSchema),
  reviewCompanyVerification
);
router.patch(
  "/companies/:companyId/suspend",
  validateParams(companyIdParamsSchema),
  suspendCompany
);

router.get("/users", validateQuery(adminUsersQuerySchema), getAdminUsers);
router.get("/users/:id", validateParams(adminUserParamsSchema), getUserById);
router.patch(
  "/users/:id/role",
  validateParams(adminUserParamsSchema),
  validateRequest(adminUserRoleSchema),
  updateUser
);
router.patch(
  "/users/:id/status",
  validateParams(adminUserParamsSchema),
  validateRequest(adminUserStatusSchema),
  updateAccountStatus
);

router.delete(
  "/jobs/:jobId",
  validateParams(jobIdParamsSchema),
  validateRequest(adminJobRemovalSchema),
  removeJobByAdmin
);

router.get("/overview", validateQuery(dashboardRangeQuerySchema), getAdminPlatformStats);
router.get("/logs", validateQuery(adminActionLogsQuerySchema), getActionLogs);

export default router;
