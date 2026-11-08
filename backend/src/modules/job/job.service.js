import { Job } from "../../models/Job.model.js";
import { SavedJob } from "../../models/SavedJob.model.js";
import { Application } from "../../models/Application.model.js";
import { Company } from "../../models/Company.model.js";
import { CompanyMember } from "../../models/CompanyMember.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import { notifyJobRemoved } from "../notification/notification.service.js";

const JOB_POPULATES = [
  {
    path: "postedByCompany",
    select: "name logo industry website isVerified isSuspended",
  },
  {
    path: "postedByUser",
    select: "firstName lastName username avatar",
  },
  {
    path: "postedBy",
    select: "firstName lastName username avatar",
  },
];

const ensureActive = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }
};

const getPagination = ({ page = 1, limit = 10 }) => ({
  page: Number(page),
  limit: Number(limit),
  skip: (Number(page) - 1) * Number(limit),
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateJobQuery = (query) => query.populate(JOB_POPULATES);

const serializeJob = (job) => {
  const result = typeof job?.toObject === "function" ? job.toObject() : job;
  return {
    ...result,
    // Keep the existing recruiter field available while clients move to company branding.
    postedBy: result.postedByUser ?? result.postedBy ?? null,
    company: result.postedByCompany ?? null,
  };
};

const getEntityId = (value) => value?._id ?? value ?? null;

const buildJobFilter = ({
  search,
  location,
  experienceLevel,
  jobType,
  isRemote,
  skills,
  status = "open",
}) => {
  const filter = { status, moderationStatus: "approved" };
  if (search) {
    const term = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: term }, { description: term }, { requiredSkills: term }];
  }
  if (location) filter.location = new RegExp(escapeRegex(location), "i");
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  if (jobType) filter.jobType = jobType;
  if (isRemote !== undefined) filter.isRemote = isRemote;
  if (skills) {
    const skillList = (Array.isArray(skills) ? skills : skills.split(","))
      .map((skill) => skill.trim())
      .filter(Boolean);
    if (skillList.length) {
      filter.requiredSkills = {
        $in: skillList.map(
          (skill) => new RegExp(`^${escapeRegex(skill)}$`, "i")
        ),
      };
    }
  }
  return filter;
};

const includeActiveCompanyJobs = async (filter) => {
  const activeCompanyIds = await Company.distinct("_id", {
    isSuspended: false,
  });

  return {
    ...filter,
    $and: [
      ...(filter.$and ?? []),
      {
        $or: [
          { postedByCompany: { $exists: false } },
          { postedByCompany: null },
          { postedByCompany: { $in: activeCompanyIds } },
        ],
      },
    ],
  };
};

const getJobOrFail = async (jobId) => {
  const job = await populateJobQuery(Job.findById(jobId));
  if (!job || (!job.postedByCompany && !job.postedByUser && !job.postedBy)) {
    throw new ApiError(404, "Job listing not found.");
  }
  return job;
};

const hasJobManagementAccess = async (job, userId) => {
  const companyId = getEntityId(job.postedByCompany);
  const posterId = getEntityId(job.postedByUser) ?? getEntityId(job.postedBy);
  if (!companyId) return String(posterId) === String(userId);

  const membership = await CompanyMember.findOne({
    company: companyId,
    user: userId,
  })
    .select("role")
    .lean();

  return Boolean(
    membership &&
      (String(posterId) === String(userId) ||
        ["owner", "admin"].includes(membership.role))
  );
};

const ensureCanManageJob = async (job, userId) => {
  if (!(await hasJobManagementAccess(job, userId))) {
    throw new ApiError(403, "You don't have permission to manage this job.");
  }

  const companyId = getEntityId(job.postedByCompany);
  if (companyId) {
    const activeCompany = await Company.exists({
      _id: companyId,
      isSuspended: false,
    });
    if (!activeCompany) {
      throw new ApiError(403, "Jobs for a suspended company cannot be managed.");
    }
  }
};

export const createJob = async (user, data) => {
  ensureActive(user);
  if (user.role !== "recruiter") {
    throw new ApiError(403, "Only recruiter accounts can post jobs.");
  }

  const { companyId, ...jobData } = data;
  const company = await Company.findById(companyId).select(
    "_id isVerified isSuspended"
  );
  if (!company) throw new ApiError(404, "Company not found.");
  if (company.isSuspended) {
    throw new ApiError(403, "A suspended company cannot post jobs.");
  }
  if (!company.isVerified) {
    throw new ApiError(403, "This company must be verified before posting jobs.");
  }

  const membership = await CompanyMember.exists({
    company: company._id,
    user: user._id,
  });
  if (!membership) {
    throw new ApiError(403, "You must be a member of this company to post jobs.");
  }

  const job = await Job.create({
    ...jobData,
    postedByCompany: company._id,
    postedByUser: user._id,
  });
  await job.populate(JOB_POPULATES);
  return serializeJob(job);
};

export const getJobs = async (user, query) => {
  ensureActive(user);
  const { page, limit, skip } = getPagination(query);
  const filter = await includeActiveCompanyJobs(buildJobFilter(query));
  const [jobs, total, saved] = await Promise.all([
    populateJobQuery(
      Job.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
    ).lean(),
    Job.countDocuments(filter),
    SavedJob.find({ user: user._id }).select("job").lean(),
  ]);
  const savedIds = new Set(saved.map(({ job }) => String(job)));

  return {
    jobs: jobs.map((job) => ({
      ...serializeJob(job),
      isSaved: savedIds.has(String(job._id)),
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getJobById = async (user, jobId) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  const companyId = getEntityId(job.postedByCompany);

  if (companyId) {
    const company = await Company.findById(companyId).select("isSuspended").lean();
    if (!company || (company.isSuspended && user.role !== "admin")) {
      throw new ApiError(404, "Job listing not found.");
    }
  }

  if (
    job.moderationStatus !== "approved" &&
    user.role !== "admin" &&
    !(await hasJobManagementAccess(job, user._id))
  ) {
    throw new ApiError(404, "Job listing not found.");
  }

  const isSaved = Boolean(await SavedJob.exists({ user: user._id, job: job._id }));
  return { ...serializeJob(job), isSaved };
};

export const updateJob = async (user, jobId, updates) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  await ensureCanManageJob(job, user._id);
  Object.assign(job, updates);
  const changedListingDetails = Object.keys(updates).some(
    (key) => key !== "status"
  );
  if (job.moderationStatus !== "pending" && changedListingDetails) {
    job.moderationStatus = "pending";
    job.moderationNote = null;
  }
  try {
    await job.save();
  } catch (error) {
    if (error.name === "ValidationError") {
      throw new ApiError(
        400,
        "Validation failed",
        Object.values(error.errors).map((item) => item.message)
      );
    }
    throw error;
  }
  await job.populate(JOB_POPULATES);
  return serializeJob(job);
};

export const closeJob = async (user, jobId) =>
  updateJob(user, jobId, { status: "closed" });

export const deleteJob = async (user, jobId) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  await ensureCanManageJob(job, user._id);
  await Promise.all([
    job.deleteOne(),
    SavedJob.deleteMany({ job: job._id }),
    Application.deleteMany({ job: job._id }),
  ]);
};

export const removeJobByAdmin = async (admin, jobId) => {
  ensureActive(admin);

  const job = await Job.findById(jobId)
    .select("_id title postedBy postedByUser postedByCompany")
    .lean();
  if (!job) throw new ApiError(404, "Job listing not found.");

  const applications = await Application.find({ job: job._id })
    .select("applicant")
    .lean();

  await Promise.all([
    Job.deleteOne({ _id: job._id }),
    SavedJob.deleteMany({ job: job._id }),
    Application.deleteMany({ job: job._id }),
  ]);

  await notifyJobRemoved({
    admin,
    job,
    applicantIds: applications.map(({ applicant }) => applicant),
  });
};

export const saveJob = async (user, jobId) => {
  ensureActive(user);
  const job = await Job.findOne({ _id: jobId, moderationStatus: "approved" })
    .select("_id status postedByCompany")
    .lean();
  if (!job) throw new ApiError(404, "Job listing not found.");
  if (job.postedByCompany) {
    const company = await Company.findOne({
      _id: job.postedByCompany,
      isVerified: true,
      isSuspended: false,
    })
      .select("_id")
      .lean();
    if (!company) throw new ApiError(404, "Job listing not found.");
  }

  const activeUser = await User.exists({ _id: user._id, accountStatus: "active" });
  if (!activeUser) throw new ApiError(404, "User account not found.");
  await SavedJob.updateOne(
    { user: user._id, job: job._id },
    { $setOnInsert: { user: user._id, job: job._id } },
    { upsert: true }
  );
};

export const unsaveJob = async (user, jobId) => {
  ensureActive(user);
  await SavedJob.deleteOne({ user: user._id, job: jobId });
};

export const getSavedJobs = async (user, pagination) => {
  ensureActive(user);
  const { page, limit, skip } = getPagination(pagination);
  const [savedJobs, totalResult] = await Promise.all([
    SavedJob.find({ user: user._id })
      .populate({
        path: "job",
        match: { moderationStatus: "approved" },
        populate: JOB_POPULATES,
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SavedJob.aggregate([
      { $match: { user: user._id } },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },
      { $match: { "job.moderationStatus": "approved" } },
      {
        $lookup: {
          from: Company.collection.name,
          localField: "job.postedByCompany",
          foreignField: "_id",
          as: "company",
        },
      },
      {
        $match: {
          $or: [
            { "job.postedByCompany": { $exists: false } },
            { "company.isSuspended": false },
          ],
        },
      },
      { $count: "total" },
    ]),
  ]);
  const total = totalResult[0]?.total ?? 0;

  return {
    jobs: savedJobs
      .filter(({ job }) => job && (!job.postedByCompany || !job.postedByCompany.isSuspended))
      .map(({ job }) => ({ ...serializeJob(job), isSaved: true })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyJobs = async (user, pagination) => {
  ensureActive(user);
  const { page, limit, skip } = getPagination(pagination);
  const filter = {
    $or: [{ postedByUser: user._id }, { postedBy: user._id }],
  };
  const [jobs, total] = await Promise.all([
    populateJobQuery(
      Job.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit)
    ).lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs: jobs.map(serializeJob),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getJobsForModeration = async (pagination) => {
  const { page, limit, skip } = getPagination(pagination);
  const filter = await includeActiveCompanyJobs({ moderationStatus: "pending" });
  const [jobs, total] = await Promise.all([
    populateJobQuery(
      Job.find(filter).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit)
    ).lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs: jobs.map(serializeJob),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const reviewJob = async (admin, jobId, { decision, note }) => {
  ensureActive(admin);
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job listing not found.");
  if (job.moderationStatus !== "pending") {
    throw new ApiError(409, "This job has already been reviewed.");
  }
  if (job.postedByCompany) {
    const company = await Company.findById(job.postedByCompany)
      .select("isVerified isSuspended")
      .lean();
    if (!company || !company.isVerified || company.isSuspended) {
      throw new ApiError(409, "The job's company must be verified and active.");
    }
  }

  job.moderationStatus = decision === "approve" ? "approved" : "rejected";
  job.moderationNote = decision === "reject" ? note : null;
  await job.save();
  await job.populate(JOB_POPULATES);
  return serializeJob(job);
};
