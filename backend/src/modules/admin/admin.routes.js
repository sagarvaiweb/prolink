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
  adminReportActionSchema,
  adminReportParamsSchema,
  adminReportsQuerySchema,
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

export default router;
