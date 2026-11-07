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
