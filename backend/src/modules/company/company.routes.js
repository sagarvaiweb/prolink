import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import requireCompanyRole from "../../middlewares/requireCompanyRole.middleware.js";
import {
  createCompany,
  getCompanyById,
  searchCompanies,
  updateCompany,
} from "./company.controller.js";
import {
  companyIdParamsSchema,
  createCompanySchema,
  updateCompanySchema,
  validateCompanyBody,
  validateCompanyQuery,
} from "./company.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/", validateCompanyQuery, searchCompanies);
router.post(
  "/",
  authorizeRole("recruiter"),
  validateCompanyBody(createCompanySchema),
  createCompany
);
router.get(
  "/:companyId",
  validateParams(companyIdParamsSchema),
  getCompanyById
);
router.patch(
  "/:companyId",
  validateParams(companyIdParamsSchema),
  requireCompanyRole("owner", "admin"),
  validateCompanyBody(updateCompanySchema),
  updateCompany
);

export default router;
