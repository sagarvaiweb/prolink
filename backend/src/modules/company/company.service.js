import mongoose from "mongoose";
import { Company } from "../../models/Company.model.js";
import { CompanyMember } from "../../models/CompanyMember.model.js";
import { User } from "../../models/User.model.js";
import { Job } from "../../models/Job.model.js";
import ApiError from "../../utils/ApiError.js";
import {
  notifyCompanyMemberAdded,
  notifyCompanyStatusChanged,
} from "../notification/notification.service.js";

const COMPANY_CREATOR_FIELDS = "firstName lastName username avatar";
const MEMBER_USER_FIELDS = "firstName lastName username avatar role";

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

  const company = await Company.findById(companyId)
    .populate("createdBy", COMPANY_CREATOR_FIELDS)
    .lean();

  if (!company) throw new ApiError(404, "Company not found.");
  if (company.isSuspended && user.role !== "admin") {
    throw new ApiError(404, "Company not found.");
  }

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

const getActiveCompany = async (companyId) => {
  const company = await Company.findOne({ _id: companyId, isSuspended: false });
  if (!company) throw new ApiError(404, "Company not found.");
  return company;
};

const ensureCanManageMembers = async (user, companyId) => {
  ensureActive(user);
  const company = await getActiveCompany(companyId);
  const managerMembership = await CompanyMember.findOne({
    company: company._id,
    user: user._id,
    role: { $in: ["owner", "admin"] },
  })
    .select("role")
    .lean();

  if (!managerMembership) {
    throw new ApiError(403, "You don't have permission to manage this company.");
  }

  return { company, managerMembership };
};

export const addCompanyMember = async (
  manager,
  companyId,
  memberId,
  role = "recruiter"
) => {
  const { company, managerMembership } = await ensureCanManageMembers(
    manager,
    companyId
  );
  if (!["admin", "recruiter"].includes(role)) {
    throw new ApiError(400, "Company member role is invalid.");
  }
  if (role === "admin" && managerMembership.role !== "owner") {
    throw new ApiError(403, "Only a company owner can assign the admin role.");
  }

  const member = await User.findById(memberId).select("_id role accountStatus");

  if (!member) throw new ApiError(404, "User account not found.");
  if (member.role !== "recruiter") {
    throw new ApiError(403, "Only recruiter accounts can join a company team.");
  }
  if (member.accountStatus !== "active") {
    throw new ApiError(403, "The recruiter account is not active.");
  }

  try {
    const companyMember = await CompanyMember.create({
      company: company._id,
      user: member._id,
      role,
    });

    await notifyCompanyMemberAdded({
      addedBy: manager,
      memberId: member._id,
      memberRole: role,
      company,
    });

    return companyMember.populate("user", MEMBER_USER_FIELDS);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "This recruiter is already a member of the company.");
    }
    throw error;
  }
};

export const removeCompanyMember = async (manager, companyId, memberId) => {
  const { company } = await ensureCanManageMembers(manager, companyId);
  const membership = await CompanyMember.findOne({
    company: company._id,
    user: memberId,
  });

  if (!membership) throw new ApiError(404, "Company member not found.");

  const isOwner = membership.role === "owner";
  if (isOwner) {
    const ownerCountUpdate = await Company.updateOne(
      { _id: company._id, ownerCount: { $gt: 1 } },
      { $inc: { ownerCount: -1 } }
    );
    if (ownerCountUpdate.modifiedCount !== 1) {
      throw new ApiError(400, "A company must have at least one owner.");
    }
  }

  try {
    const deletion = await CompanyMember.deleteOne({ _id: membership._id });
    if (deletion.deletedCount !== 1) {
      throw new ApiError(404, "Company member not found.");
    }
  } catch (error) {
    if (isOwner) {
      try {
        await Company.updateOne(
          { _id: company._id },
          { $inc: { ownerCount: 1 } }
        );
      } catch (rollbackError) {
        console.error("Failed to restore company owner count.", rollbackError);
      }
    }
    throw error;
  }
};

export const getCompanyMembers = async (user, companyId, query) => {
  ensureActive(user);
  const company = await getActiveCompany(companyId);
  const { page, limit, skip } = getPagination(query);

  const [members, total] = await Promise.all([
    CompanyMember.find({ company: company._id })
      .populate("user", MEMBER_USER_FIELDS)
      .sort({ addedAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CompanyMember.countDocuments({ company: company._id }),
  ]);

  return {
    members: members.filter(({ user: memberUser }) => memberUser),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCompaniesForVerification = async (admin, query) => {
  ensureActive(admin);
  if (admin.role !== "admin") throw new ApiError(403, "Admin access required.");

  const { page, limit, skip } = getPagination(query);
  const filter = { isVerified: false, isSuspended: false };
  if (query.industry) {
    filter.industry = new RegExp(`^${escapeRegex(query.industry)}$`, "i");
  }
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
      .sort({ createdAt: 1, _id: 1 })
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

const getCompanyMemberIds = async (companyId) =>
  CompanyMember.distinct("user", { company: companyId });

export const verifyCompany = async (admin, companyId) => {
  ensureActive(admin);
  if (admin.role !== "admin") throw new ApiError(403, "Admin access required.");

  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found.");
  if (company.isSuspended) {
    throw new ApiError(409, "A suspended company cannot be verified.");
  }
  if (company.isVerified) {
    throw new ApiError(409, "Company has already been verified.");
  }

  company.isVerified = true;
  await company.save();

  const memberIds = await getCompanyMemberIds(company._id);
  await notifyCompanyStatusChanged({
    admin,
    company,
    memberIds,
    isVerified: true,
  });

  return company;
};

export const suspendCompany = async (admin, companyId) => {
  ensureActive(admin);
  if (admin.role !== "admin") throw new ApiError(403, "Admin access required.");

  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found.");

  const wasAlreadySuspended = company.isSuspended;
  if (!wasAlreadySuspended) {
    company.isSuspended = true;
    await company.save();
  }

  // Company state is the source of truth for reads and new posts; close its
  // open jobs as well so the normal job lifecycle reflects the suspension.
  const jobsUpdate = await Job.updateMany(
    { postedByCompany: company._id, status: "open" },
    { $set: { status: "closed" } }
  );

  if (!wasAlreadySuspended) {
    const memberIds = await getCompanyMemberIds(company._id);
    await notifyCompanyStatusChanged({
      admin,
      company,
      memberIds,
      isVerified: false,
    });
  }

  return { company, closedJobCount: jobsUpdate.modifiedCount };
};
