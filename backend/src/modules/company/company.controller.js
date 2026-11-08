import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as companyService from "./company.service.js";

export const createCompany = asyncHandler(async (req, res) => {
  const result = await companyService.createCompany(req.user, req.body);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Company created successfully."));
});

export const getCompanyById = asyncHandler(async (req, res) => {
  const result = await companyService.getCompanyById(req.user, req.params.companyId);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company fetched successfully."));
});

export const searchCompanies = asyncHandler(async (req, res) => {
  const result = await companyService.searchCompanies(req.user, req.validatedQuery);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Companies fetched successfully."));
});

export const updateCompany = asyncHandler(async (req, res) => {
  const result = await companyService.updateCompany(
    req.user,
    req.params.companyId,
    req.body
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company updated successfully."));
});

export const addCompanyMember = asyncHandler(async (req, res) => {
  const member = await companyService.addCompanyMember(
    req.user,
    req.params.companyId,
    req.body.userId,
    req.body.role
  );
  res
    .status(201)
    .json(new ApiResponse(201, member, "Recruiter added to company successfully."));
});

export const removeCompanyMember = asyncHandler(async (req, res) => {
  await companyService.removeCompanyMember(
    req.user,
    req.params.companyId,
    req.params.userId
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Company member removed successfully."));
});

export const getCompanyMembers = asyncHandler(async (req, res) => {
  const result = await companyService.getCompanyMembers(
    req.user,
    req.params.companyId,
    req.validatedQuery
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company members fetched successfully."));
});

export const getCompaniesForVerification = asyncHandler(async (req, res) => {
  const result = await companyService.getCompaniesForVerification(
    req.user,
    req.validatedQuery
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Companies awaiting verification fetched successfully."));
});

export const verifyCompany = asyncHandler(async (req, res) => {
  const company = await companyService.verifyCompany(
    req.user,
    req.params.companyId
  );
  res
    .status(200)
    .json(new ApiResponse(200, company, "Company verified successfully."));
});

export const suspendCompany = asyncHandler(async (req, res) => {
  const result = await companyService.suspendCompany(
    req.user,
    req.params.companyId
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company suspended successfully."));
});
