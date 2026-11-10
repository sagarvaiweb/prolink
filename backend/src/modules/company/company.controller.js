import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as companyService from "./company.service.js";

export const createCompany = asyncHandler(async (req, res) => {
  const result = await companyService.createCompany(req.user, {
    ...req.body,
    ...(req.body.website === "" ? { website: null } : {}),
    ...(req.file ? { logo: req.file.path } : {}),
  });
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
  const updates = {
    ...req.body,
    ...(req.body.website === "" ? { website: null } : {}),
    ...(req.file ? { logo: req.file.path } : {}),
  };
  const result = await companyService.updateCompany(
    req.user,
    req.params.companyId,
    updates
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company updated successfully."));
});

export const deleteCompany = asyncHandler(async (req, res) => {
  await companyService.deleteCompany(req.user, req.params.companyId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Company deleted successfully."));
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

export const searchRecruiterCandidates = asyncHandler(async (req, res) => {
  const result = await companyService.searchRecruiterCandidates(
    req.user,
    req.params.companyId,
    req.validatedQuery
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Recruiter candidates fetched successfully."));
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

export const reviewCompanyVerification = asyncHandler(async (req, res) => {
  const { decision, note } = req.body;
  const company = decision === "approve"
    ? await companyService.verifyCompany(req.user, req.params.companyId, note)
    : await companyService.rejectCompanyVerification(
        req.user,
        req.params.companyId,
        note
      );

  res.status(200).json(
    new ApiResponse(
      200,
      company,
      decision === "approve"
        ? "Company verification approved successfully."
        : "Company verification rejected successfully."
    )
  );
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

export const followCompany = asyncHandler(async (req, res) => {
  const result = await companyService.followCompany(
    req.user,
    req.params.companyId
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company followed successfully."));
});

export const unfollowCompany = asyncHandler(async (req, res) => {
  const result = await companyService.unfollowCompany(
    req.user,
    req.params.companyId
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company unfollowed successfully."));
});

export const getCompanyJobs = asyncHandler(async (req, res) => {
  const result = await companyService.getCompanyJobs(
    req.user,
    req.params.companyId,
    req.validatedQuery
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Company jobs fetched successfully."));
});
