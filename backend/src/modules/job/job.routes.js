import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  closeJob,
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  getJobsForModeration,
  getMyJobs,
  getSavedJobs,
  reviewJob,
  saveJob,
  unsaveJob,
  updateJob,
} from "./job.controller.js";
import {
  createJobSchema,
  jobIdParamsSchema,
  moderationReviewSchema,
  updateJobSchema,
  validateJobBody,
  validateJobQuery,
} from "./job.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/mine", authorizeRole("recruiter"), validateJobQuery, getMyJobs);
router.get(
  "/moderation/pending",
  authorizeRole("admin"),
  validateJobQuery,
  getJobsForModeration
);
router.patch(
  "/moderation/:jobId",
  authorizeRole("admin"),
  validateParams(jobIdParamsSchema),
  validateRequest(moderationReviewSchema),
  reviewJob
);
router.get("/saved", validateJobQuery, getSavedJobs);
router.post("/", authorizeRole("recruiter"), validateJobBody(createJobSchema), createJob);
router.get("/", validateJobQuery, getJobs);
router.get("/:jobId", validateParams(jobIdParamsSchema), getJobById);
router.patch(
  "/:jobId/close",
  authorizeRole("recruiter"),
  validateParams(jobIdParamsSchema),
  closeJob
);
router.post("/:jobId/save", validateParams(jobIdParamsSchema), saveJob);
router.delete("/:jobId/save", validateParams(jobIdParamsSchema), unsaveJob);
router.patch(
  "/:jobId",
  authorizeRole("recruiter"),
  validateParams(jobIdParamsSchema),
  validateJobBody(updateJobSchema),
  updateJob
);
router.delete(
  "/:jobId",
  authorizeRole("recruiter"),
  validateParams(jobIdParamsSchema),
  deleteJob
);

export default router;
