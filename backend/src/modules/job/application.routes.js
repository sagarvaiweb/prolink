import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  applicationIdParamsSchema,
  updateApplicationStatusSchema,
  validateApplicationQuery,
} from "./application.validation.js";
import {
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} from "./application.controller.js";

const router = Router();

router.use(authenticateUser);
router.get(
  "/me",
  authorizeRole("student", "professional"),
  validateApplicationQuery,
  getMyApplications
);
router.patch(
  "/:applicationId/status",
  authorizeRole("recruiter"),
  validateParams(applicationIdParamsSchema),
  validateRequest(updateApplicationStatusSchema),
  updateApplicationStatus
);
router.delete(
  "/:applicationId",
  authorizeRole("student", "professional"),
  validateParams(applicationIdParamsSchema),
  withdrawApplication
);

export default router;
