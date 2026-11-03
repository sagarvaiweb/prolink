import { Job } from "../../models/Job.model.js";
import { SavedJob } from "../../models/SavedJob.model.js";
import { Application } from "../../models/Application.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

const JOB_POPULATE = {
  path: "postedBy",
  select: "firstName lastName username avatar",
};

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
          (skill) => new RegExp("^" + escapeRegex(skill) + "$", "i")
        ),
      };
    }
  }
  return filter;
};

const getJobOrFail = async (jobId) => {
  const job = await Job.findById(jobId).populate(JOB_POPULATE);
  if (!job || !job.postedBy) throw new ApiError(404, "Job listing not found.");
  return job;
};

const ensureOwner = (job, userId) => {
  if (!job.postedBy._id.equals(userId)) {
    throw new ApiError(403, "You can only manage jobs you posted.");
  }
};

export const createJob = async (user, data) => {
  ensureActive(user);
  const job = await Job.create({ ...data, postedBy: user._id });
  return job.populate(JOB_POPULATE);
};

export const getJobs = async (user, query) => {
  ensureActive(user);
  const { page, limit, skip } = getPagination(query);
  const filter = buildJobFilter(query);
  const [jobs, total, saved] = await Promise.all([
    Job.find(filter).populate(JOB_POPULATE).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
    SavedJob.find({ user: user._id }).select("job").lean(),
  ]);
  const savedIds = new Set(saved.map(({ job }) => String(job)));
  return {
    jobs: jobs.map((job) => ({ ...job, isSaved: savedIds.has(String(job._id)) })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getJobById = async (user, jobId) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  if (
    job.moderationStatus !== "approved" &&
    String(job.postedBy._id) !== String(user._id) &&
    user.role !== "admin"
  ) {
    throw new ApiError(404, "Job listing not found.");
  }
  const isSaved = Boolean(await SavedJob.exists({ user: user._id, job: job._id }));
  return { ...job.toObject(), isSaved };
};

export const updateJob = async (user, jobId, updates) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  ensureOwner(job, user._id);
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
  return job.populate(JOB_POPULATE);
};

export const closeJob = async (user, jobId) => updateJob(user, jobId, { status: "closed" });

export const deleteJob = async (user, jobId) => {
  ensureActive(user);
  const job = await getJobOrFail(jobId);
  ensureOwner(job, user._id);
  await Promise.all([
    job.deleteOne(),
    SavedJob.deleteMany({ job: job._id }),
    Application.deleteMany({ job: job._id }),
  ]);
};

export const saveJob = async (user, jobId) => {
  ensureActive(user);
  const job = await Job.findOne({ _id: jobId, moderationStatus: "approved" })
    .select("_id status")
    .lean();
  if (!job) throw new ApiError(404, "Job listing not found.");
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
        populate: JOB_POPULATE,
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SavedJob.aggregate([
      { $match: { user: user._id } },
      { $lookup: { from: "jobs", localField: "job", foreignField: "_id", as: "job" } },
      { $match: { "job.moderationStatus": "approved" } },
      { $count: "total" },
    ]),
  ]);
  const total = totalResult[0]?.total ?? 0;
  return {
    jobs: savedJobs.filter(({ job }) => job).map(({ job }) => ({ ...job, isSaved: true })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyJobs = async (user, pagination) => {
  ensureActive(user);
  const { page, limit, skip } = getPagination(pagination);
  const filter = { postedBy: user._id };
  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);
  return { jobs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getJobsForModeration = async (pagination) => {
  const { page, limit, skip } = getPagination(pagination);
  const filter = { moderationStatus: "pending" };
  const [jobs, total] = await Promise.all([
    Job.find(filter).populate(JOB_POPULATE).sort({ createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);
  return { jobs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const reviewJob = async (admin, jobId, { decision, note }) => {
  ensureActive(admin);
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job listing not found.");
  if (job.moderationStatus !== "pending") throw new ApiError(409, "This job has already been reviewed.");
  job.moderationStatus = decision === "approve" ? "approved" : "rejected";
  job.moderationNote = decision === "reject" ? note : null;
  await job.save();
  return job.populate(JOB_POPULATE);
};
