import { Application } from "../../models/Application.model.js";
import { Job } from "../../models/Job.model.js";
import { Profile } from "../../models/Profile.model.js";
import ApiError from "../../utils/ApiError.js";
import {
  notifyApplicationStatus,
  notifyNewApplication,
} from "../notification/notification.service.js";
import { getResumeMatchScore } from "./resumeMatch.service.js";

const APPLICANT_FIELDS = "firstName lastName username avatar role";

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

const getOpenJob = async (jobId) => {
  const job = await Job.findOne({
    _id: jobId,
    status: "open",
    moderationStatus: "approved",
  })
    .select("_id postedBy requiredSkills status moderationStatus")
    .lean();

  if (!job) {
    const existingJob = await Job.exists({ _id: jobId });
    if (!existingJob) throw new ApiError(404, "Job listing not found.");
    throw new ApiError(400, "This job is no longer accepting applications.");
  }

  return job;
};

const normalizeDuplicateApplication = (error) => {
  if (error?.code === 11000) {
    throw new ApiError(409, "You have already applied to this job.");
  }
  throw error;
};

export const applyToJob = async (applicant, jobId) => {
  ensureActive(applicant);

  const [job, profile] = await Promise.all([
    getOpenJob(jobId),
    Profile.findOne({ user: applicant._id }).select("resumeUrl skills").lean(),
  ]);

  if (!profile?.resumeUrl) {
    throw new ApiError(400, "Please upload a resume before applying.");
  }

  const match = await getResumeMatchScore({ profile, job });
  let application;

  try {
    application = await Application.create({
      job: job._id,
      applicant: applicant._id,
      resumeUrl: profile.resumeUrl,
      ...match,
    });
  } catch (error) {
    normalizeDuplicateApplication(error);
  }

  const jobUpdate = await Job.updateOne(
    {
      _id: job._id,
      status: "open",
      moderationStatus: "approved",
    },
    { $inc: { applicantCount: 1 } }
  );

  if (jobUpdate.modifiedCount !== 1) {
    await application.deleteOne();
    throw new ApiError(400, "This job is no longer accepting applications.");
  }

  await notifyNewApplication({
    applicant,
    recruiterId: job.postedBy,
    job,
    application,
  });

  return application;
};

export const withdrawApplication = async (applicant, applicationId) => {
  ensureActive(applicant);

  const application = await Application.findOne({
    _id: applicationId,
    applicant: applicant._id,
  });

  if (!application) throw new ApiError(404, "Application not found.");
  if (application.status !== "applied") {
    throw new ApiError(400, "Only applications awaiting review can be withdrawn.");
  }

  const deletedApplication = await Application.findOneAndDelete({
    _id: application._id,
    applicant: applicant._id,
    status: "applied",
  });

  if (!deletedApplication) {
    throw new ApiError(409, "This application has already been updated.");
  }

  await Job.updateOne(
    { _id: application.job, applicantCount: { $gt: 0 } },
    { $inc: { applicantCount: -1 } }
  );
};

export const getMyApplications = async (applicant, pagination) => {
  ensureActive(applicant);

  const { page, limit, skip } = getPagination(pagination);
  const filter = { applicant: applicant._id };
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate({
        path: "job",
        select: "title location jobType experienceLevel status postedBy",
        populate: { path: "postedBy", select: "firstName lastName username" },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return {
    applications: applications.filter(({ job }) => job),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getApplicantsForJob = async (recruiter, jobId, pagination) => {
  ensureActive(recruiter);

  const job = await Job.findById(jobId).select("_id postedBy").lean();
  if (!job) throw new ApiError(404, "Job listing not found.");
  if (String(job.postedBy) !== String(recruiter._id)) {
    throw new ApiError(403, "You can only manage jobs you posted.");
  }

  const { page, limit, skip } = getPagination(pagination);
  const filter = { job: job._id };
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate("applicant", APPLICANT_FIELDS)
      .sort({ matchScore: -1, createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return {
    applications: applications.filter(({ applicant }) => applicant),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const allowedTransitions = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["rejected", "hired"],
  rejected: [],
  hired: [],
};

export const updateApplicationStatus = async (
  recruiter,
  applicationId,
  nextStatus
) => {
  ensureActive(recruiter);

  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError(404, "Application not found.");

  const job = await Job.findById(application.job)
    .select("postedBy title")
    .lean();
  if (!job) throw new ApiError(404, "Job listing not found.");
  if (String(job.postedBy) !== String(recruiter._id)) {
    throw new ApiError(403, "You can only manage applicants for your own jobs.");
  }

  if (!allowedTransitions[application.status]?.includes(nextStatus)) {
    throw new ApiError(400, "Invalid application status change.");
  }

  const updatedApplication = await Application.findOneAndUpdate(
    { _id: application._id, status: application.status },
    { $set: { status: nextStatus, statusUpdatedAt: new Date() } },
    { returnDocument: "after", runValidators: true }
  ).populate("applicant", APPLICANT_FIELDS);

  if (!updatedApplication) {
    throw new ApiError(409, "This application has already been updated.");
  }

  await notifyApplicationStatus({
    recruiter,
    applicantId: application.applicant,
    application: updatedApplication,
    job,
  });

  return updatedApplication;
};
