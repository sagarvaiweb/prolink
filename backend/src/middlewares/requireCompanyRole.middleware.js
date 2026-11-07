import { Company } from "../models/Company.model.js";
import { CompanyMember } from "../models/CompanyMember.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const requireCompanyRole = (...allowedRoles) =>
  asyncHandler(async (req, _res, next) => {
    if (req.user.accountStatus !== "active") {
      throw new ApiError(403, "Your account is not active.");
    }

    const company = await Company.findById(req.params.companyId).select("_id");
    if (!company) throw new ApiError(404, "Company not found.");

    const membership = await CompanyMember.findOne({
      company: company._id,
      user: req.user._id,
    })
      .select("role")
      .lean();

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ApiError(403, "You don't have permission to manage this company.");
    }

    req.company = company;
    req.companyMembership = membership;
    next();
  });

export default requireCompanyRole;
