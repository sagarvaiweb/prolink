import mongoose from "mongoose";
import { Company } from "../../models/Company.model.js";
import { CompanyMember } from "../../models/CompanyMember.model.js";
import ApiError from "../../utils/ApiError.js";

const COMPANY_CREATOR_FIELDS = "firstName lastName username avatar";

const ensureActive = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPagination = ({ page = 1, limit = 20 }) => ({
  page: Number(page),
  limit: Number(limit),
  skip: (Number(page) - 1) * Number(limit),
});

const normalizeCompanyWriteError = (error) => {
  if (error?.code === 11000) {
    return new ApiError(409, "A company with this name already exists.");
  }
  if (error?.name === "ValidationError") {
    return new ApiError(
      400,
      "Validation failed",
      Object.values(error.errors).map(({ message }) => message)
    );
  }
  return error;
};

export const createCompany = async (user, companyData) => {
  ensureActive(user);
  if (user.role !== "recruiter") {
    throw new ApiError(403, "Only recruiter accounts can create companies.");
  }

  let company;
  try {
    company = await Company.create({ ...companyData, createdBy: user._id });
    await CompanyMember.create({
      company: company._id,
      user: user._id,
      role: "owner",
    });
  } catch (error) {
    if (company?._id) {
      const cleanupResults = await Promise.allSettled([
        CompanyMember.deleteOne({ company: company._id, user: user._id }),
        Company.deleteOne({ _id: company._id }),
      ]);
      cleanupResults
        .filter((result) => result.status === "rejected")
        .forEach((result) =>
          console.error("Failed to roll back company creation.", result.reason)
        );
    }
    throw normalizeCompanyWriteError(error);
  }

  return {
    company: await Company.findById(company._id)
      .populate("createdBy", COMPANY_CREATOR_FIELDS)
      .lean(),
    viewerRole: "owner",
  };
};

export const getCompanyById = async (user, companyId) => {
  ensureActive(user);
  if (!mongoose.isValidObjectId(companyId)) {
    throw new ApiError(400, "Invalid company ID.");
  }

  const company = await Company.findOne({
    _id: companyId,
    isSuspended: false,
  })
    .populate("createdBy", COMPANY_CREATOR_FIELDS)
    .lean();

  if (!company) throw new ApiError(404, "Company not found.");

  const membership = await CompanyMember.findOne({
    company: company._id,
    user: user._id,
  })
    .select("role")
    .lean();

  return { company, viewerRole: membership?.role ?? null };
};

export const searchCompanies = async (user, query) => {
  ensureActive(user);

  const { page, limit, skip } = getPagination(query);
  const filter = { isSuspended: false };
  if (query.industry) filter.industry = new RegExp(`^${escapeRegex(query.industry)}$`, "i");
  if (query.companySize) filter.companySize = query.companySize;
  if (query.search) {
    const search = new RegExp(escapeRegex(query.search.trim()), "i");
    filter.$or = [
      { name: search },
      { industry: search },
      { location: search },
    ];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate("createdBy", COMPANY_CREATOR_FIELDS)
      .sort({ nameKey: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Company.countDocuments(filter),
  ]);

  return {
    companies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateCompany = async (user, companyId, updates) => {
  ensureActive(user);
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found.");

  const membership = await CompanyMember.findOne({
    company: company._id,
    user: user._id,
    role: { $in: ["owner", "admin"] },
  });
  if (!membership) {
    throw new ApiError(403, "You don't have permission to manage this company.");
  }

  Object.assign(company, updates);
  try {
    await company.save();
  } catch (error) {
    throw normalizeCompanyWriteError(error);
  }

  return {
    company: await Company.findById(company._id)
      .populate("createdBy", COMPANY_CREATOR_FIELDS)
      .lean(),
    viewerRole: membership.role,
  };
};
