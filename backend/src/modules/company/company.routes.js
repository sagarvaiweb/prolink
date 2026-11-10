import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import requireCompanyRole from "../../middlewares/requireCompanyRole.middleware.js";
import { uploadCompanyLogo } from "../../middlewares/upload.middleware.js";
import {
  createCompany,
  deleteCompany,
  addCompanyMember,
  getCompaniesForVerification,
  getCompanyById,
  getCompanyMembers,
  searchRecruiterCandidates,
  getCompanyJobs,
  followCompany,
  removeCompanyMember,
  suspendCompany,
  searchCompanies,
  updateCompany,
  unfollowCompany,
  verifyCompany,
} from "./company.controller.js";
import {
  companyIdParamsSchema,
  companyMemberParamsSchema,
  addCompanyMemberSchema,
  createCompanySchema,
  updateCompanySchema,
  validateCompanyBody,
  validateCompanyQuery,
  validateCompanyMembersQuery,
  validateCompanyRecruiterCandidatesQuery,
  validateCompanyJobsQuery,
} from "./company.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/", validateCompanyQuery, searchCompanies);
router.get(
  "/admin/pending",
  authorizeRole("admin"),
  validateCompanyQuery,
  getCompaniesForVerification
);
router.patch(
  "/admin/:companyId/verify",
  authorizeRole("admin"),
  validateParams(companyIdParamsSchema),
  verifyCompany
);
router.patch(
  "/admin/:companyId/suspend",
  authorizeRole("admin"),
  validateParams(companyIdParamsSchema),
  suspendCompany
);
router.delete(
  "/:companyId",
  validateParams(companyIdParamsSchema),
  requireCompanyRole("owner"),
  deleteCompany
);
router.post(
  "/",
  authorizeRole("recruiter"),
  uploadCompanyLogo.single("logo"),
  validateCompanyBody(createCompanySchema),
  createCompany
);
router.get(
  "/:companyId",
  validateParams(companyIdParamsSchema),
  getCompanyById
);
router.get(
  "/:companyId/members",
  validateParams(companyIdParamsSchema),
  validateCompanyMembersQuery,
  getCompanyMembers
);
router.get(
  "/:companyId/recruiter-candidates",
  validateParams(companyIdParamsSchema),
  requireCompanyRole("owner", "admin"),
  validateCompanyRecruiterCandidatesQuery,
  searchRecruiterCandidates
);
router.post(
  "/:companyId/members",
  validateParams(companyIdParamsSchema),
  requireCompanyRole("owner", "admin"),
  validateCompanyBody(addCompanyMemberSchema),
  addCompanyMember
);
router.delete(
  "/:companyId/members/:userId",
  validateParams(companyMemberParamsSchema),
  requireCompanyRole("owner", "admin"),
  removeCompanyMember
);
router.post(
  "/:companyId/follow",
  validateParams(companyIdParamsSchema),
  followCompany
);
router.delete(
  "/:companyId/follow",
  validateParams(companyIdParamsSchema),
  unfollowCompany
);
router.get(
  "/:companyId/jobs",
  validateParams(companyIdParamsSchema),
  validateCompanyJobsQuery,
  getCompanyJobs
);
router.patch(
  "/:companyId",
  validateParams(companyIdParamsSchema),
  requireCompanyRole("owner", "admin"),
  uploadCompanyLogo.single("logo"),
  validateCompanyBody(updateCompanySchema),
  updateCompany
);

export default router;
