import mongoose from "mongoose";
import { Company } from "../../models/Company.model.js";
import { CompanyMember } from "../../models/CompanyMember.model.js";
import { CompanyFollow } from "../../models/CompanyFollow.model.js";
import { SavedJob } from "../../models/SavedJob.model.js";
import { User } from "../../models/User.model.js";
import { Job } from "../../models/Job.model.js";
import ApiError from "../../utils/ApiError.js";
import {
  notifyCompanyMemberAdded,
  notifyCompanyVerificationRejected,
  notifyCompanyStatusChanged,
} from "../notification/notification.service.js";
import { logAdminAction } from "../admin/actionLog.service.js";
import { deleteSearchDocument, indexCompany } from "../search/searchDocument.service.js";

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
    await indexCompany(company);
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
        deleteSearchDocument("company", company._id),
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
  const isFollowing = Boolean(
    await CompanyFollow.exists({ company: company._id, user: user._id })
  );

  return { company, viewerRole: membership?.role ?? null, isFollowing };
};

export const searchCompanies = async (user, query) => {
  ensureActive(user);

  const { page, limit, skip } = getPagination(query);
  const filter = { isSuspended: false };
  if (query.isVerified !== undefined) filter.isVerified = query.isVerified;
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
  const followedCompanyIds = companies.length
    ? await CompanyFollow.distinct("company", {
        user: user._id,
        company: { $in: companies.map(({ _id }) => _id) },
      })
    : [];
  const followedCompanyIdSet = new Set(followedCompanyIds.map(String));

  return {
    companies: companies.map((company) => ({
      ...company,
      isFollowing: followedCompanyIdSet.has(String(company._id)),
    })),
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
    await indexCompany(company);
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

export const deleteCompany = async (user, companyId) => {
  ensureActive(user);
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found.");

  const ownership = await CompanyMember.findOne({
    company: company._id,
    user: user._id,
    role: "owner",
  })
    .select("_id")
    .lean();
  if (!ownership) {
    throw new ApiError(403, "Only a company owner can delete this company.");
  }
  if (company.ownerCount > 1) {
    throw new ApiError(
      409,
      "Remove the other owners before deleting this company."
    );
  }

  const hasJobHistory = await Job.exists({ postedByCompany: company._id });
  if (hasJobHistory) {
    throw new ApiError(
      409,
      "This company has job history and cannot be deleted. Ask an admin to suspend it instead."
    );
  }

  const deletion = await Company.deleteOne({ _id: company._id });
  if (deletion.deletedCount !== 1) {
    throw new ApiError(409, "The company changed while it was being deleted.");
  }

  await Promise.all([
    CompanyMember.deleteMany({ company: company._id }),
    CompanyFollow.deleteMany({ company: company._id }),
    deleteSearchDocument("company", company._id),
  ]);
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

export const searchRecruiterCandidates = async (manager, companyId, query) => {
  const { company } = await ensureCanManageMembers(manager, companyId);
  const { page, limit, skip } = getPagination(query);
  const search = new RegExp(escapeRegex(query.search.trim()), "i");
  const existingMemberIds = await CompanyMember.distinct("user", {
    company: company._id,
  });
  const filter = {
    role: "recruiter",
    accountStatus: "active",
    _id: { $nin: existingMemberIds },
    $or: [
      { firstName: search },
      { lastName: search },
      { username: search },
    ],
  };

  const [recruiters, total] = await Promise.all([
    User.find(filter)
      .select("firstName lastName username avatar")
      .sort({ firstName: 1, lastName: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    recruiters,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const followCompany = async (user, companyId) => {
  ensureActive(user);
  const company = await getActiveCompany(companyId);

  try {
    await CompanyFollow.create({ company: company._id, user: user._id });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const currentCompany = await Company.findById(company._id)
      .select("followerCount")
      .lean();
    return {
      isFollowing: true,
      followerCount: currentCompany?.followerCount ?? 0,
    };
  }

  try {
    const update = await Company.updateOne(
      { _id: company._id, isSuspended: false },
      { $inc: { followerCount: 1 } }
    );
    if (update.modifiedCount !== 1) {
      await CompanyFollow.deleteOne({ company: company._id, user: user._id });
      throw new ApiError(404, "Company not found.");
    }
  } catch (error) {
    try {
      await CompanyFollow.deleteOne({ company: company._id, user: user._id });
    } catch (cleanupError) {
      console.error("Failed to roll back company follow.", cleanupError);
    }
    throw error;
  }

  const updatedCompany = await Company.findById(company._id)
    .select("followerCount")
    .lean();
  return { isFollowing: true, followerCount: updatedCompany?.followerCount ?? 0 };
};

export const unfollowCompany = async (user, companyId) => {
  ensureActive(user);
  const company = await getActiveCompany(companyId);
  const deletion = await CompanyFollow.deleteOne({
    company: company._id,
    user: user._id,
  });

  if (deletion.deletedCount === 1) {
    const counterUpdate = await Company.updateOne(
      { _id: company._id, followerCount: { $gt: 0 } },
      { $inc: { followerCount: -1 } }
    );

    if (counterUpdate.modifiedCount !== 1) {
      const actualFollowerCount = await CompanyFollow.countDocuments({
        company: company._id,
      });
      await Company.updateOne(
        { _id: company._id },
        { $set: { followerCount: actualFollowerCount } }
      );
    }
  }

  const updatedCompany = await Company.findById(company._id)
    .select("followerCount")
    .lean();
  return {
    isFollowing: false,
    followerCount: updatedCompany?.followerCount ?? 0,
  };
};

export const getCompanyJobs = async (user, companyId, query) => {
  ensureActive(user);
  const company = await getActiveCompany(companyId);
  const { page, limit, skip } = getPagination(query);
  const filter = {
    postedByCompany: company._id,
    status: "open",
    moderationStatus: "approved",
  };

  const [jobs, total, savedJobs] = await Promise.all([
    Job.find(filter)
      .populate("postedByCompany", "name logo industry website isVerified")
      .populate("postedByUser", "firstName lastName username avatar")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
    SavedJob.find({ user: user._id }).select("job").lean(),
  ]);
  const savedIds = new Set(savedJobs.map(({ job }) => String(job)));

  return {
    company,
    jobs: jobs.map((job) => ({
      ...job,
      postedBy: job.postedByUser ?? null,
      company: job.postedByCompany ?? null,
      isSaved: savedIds.has(String(job._id)),
    })),
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
  const filter = {
    isVerified: false,
    isSuspended: false,
    verificationStatus: { $ne: "rejected" },
  };
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

export const verifyCompany = async (admin, companyId, note = "") => {
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
  if (company.verificationStatus === "rejected") {
    throw new ApiError(409, "A rejected company cannot be verified without reapplying.");
  }

  company.isVerified = true;
  company.verificationStatus = "approved";
  company.verificationNote = note;
  company.verificationReviewedBy = admin._id;
  company.verificationReviewedAt = new Date();
  await company.save();
  await indexCompany(company);

  const memberIds = await getCompanyMemberIds(company._id);
  await notifyCompanyStatusChanged({
    admin,
    company,
    memberIds,
    isVerified: true,
  });
  await logAdminAction({
    admin,
    action: "company_verified",
    targetType: "company",
    targetId: company._id,
    note: `Verification approved${note ? `; ${note}` : ""}`.slice(0, 500),
  });

  return company;
};

export const rejectCompanyVerification = async (admin, companyId, note) => {
  ensureActive(admin);
  if (admin.role !== "admin") throw new ApiError(403, "Admin access required.");

  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company not found.");
  if (company.isSuspended) {
    throw new ApiError(409, "A suspended company cannot be reviewed.");
  }
  if (company.isVerified || company.verificationStatus === "approved") {
    throw new ApiError(409, "An approved company cannot be rejected.");
  }
  if (company.verificationStatus === "rejected") {
    throw new ApiError(409, "Company verification has already been rejected.");
  }

  company.verificationStatus = "rejected";
  company.verificationNote = note;
  company.verificationReviewedBy = admin._id;
  company.verificationReviewedAt = new Date();
  await company.save();
  await indexCompany(company);

  const memberIds = await getCompanyMemberIds(company._id);
  await notifyCompanyVerificationRejected({ admin, company, memberIds, note });
  await logAdminAction({
    admin,
    action: "company_rejected",
    targetType: "company",
    targetId: company._id,
    note: note.slice(0, 500),
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
    await indexCompany(company);
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
    await logAdminAction({
      admin,
      action: "company_suspended",
      targetType: "company",
      targetId: company._id,
      note: "Company suspended by administrator.",
    });
  }

  return { company, closedJobCount: jobsUpdate.modifiedCount };
};
