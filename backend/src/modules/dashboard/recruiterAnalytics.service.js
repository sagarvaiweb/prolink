import { Application } from "../../models/Application.model.js";
import { Job } from "../../models/Job.model.js";
import { JobView } from "../../models/JobView.model.js";
import ApiError from "../../utils/ApiError.js";

const APPLICATION_STATUSES = ["applied", "shortlisted", "rejected", "hired"];

const ensureActive = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }
};

const getOwnedJob = async (recruiter, jobId) => {
  const job = await Job.findById(jobId)
    .select("_id postedBy postedByUser")
    .lean();
  if (!job) {
    throw new ApiError(404, "Job listing not found.");
  }
  const posterId = job.postedByUser ?? job.postedBy;
  if (String(posterId) !== String(recruiter._id)) {
    throw new ApiError(403, "You don't have access to this job's analytics.");
  }
  return job;
};

export const getJobFunnel = async (recruiter, jobId) => {
  ensureActive(recruiter);
  const job = await getOwnedJob(recruiter, jobId);
  const rows = await Application.aggregate([
    { $match: { job: job._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [status, 0])
  );

  for (const row of rows) {
    if (APPLICATION_STATUSES.includes(row._id)) {
      byStatus[row._id] = row.count;
    }
  }

  return {
    jobId: String(job._id),
    totalApplicants: Object.values(byStatus).reduce(
      (total, count) => total + count,
      0
    ),
    byStatus,
  };
};

export const getJobsOverview = async (recruiter) => {
  ensureActive(recruiter);
  const jobs = await Job.find({
    $or: [{ postedByUser: recruiter._id }, { postedBy: recruiter._id }],
  })
    .select("_id title status moderationStatus createdAt applicantCount")
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  if (jobs.length === 0) {
    return { jobs: [], totals: { jobs: 0, views: 0, applicants: 0 } };
  }

  const jobIds = jobs.map(({ _id }) => _id);
  const [applicationRows, viewRows] = await Promise.all([
    Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      {
        $group: {
          _id: { job: "$job", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]),
    JobView.aggregate([
      { $match: { job: { $in: jobIds } } },
      {
        $group: {
          _id: "$job",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const applicationsByJob = new Map();
  for (const row of applicationRows) {
    const jobKey = String(row._id.job);
    if (!applicationsByJob.has(jobKey)) {
      applicationsByJob.set(
        jobKey,
        Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]))
      );
    }
    applicationsByJob.get(jobKey)[row._id.status] = row.count;
  }

  const viewsByJob = new Map(
    viewRows.map((row) => [String(row._id), row.count])
  );
  const result = jobs.map((job) => {
    const byStatus = applicationsByJob.get(String(job._id)) ??
      Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0]));
    const applicants = Object.values(byStatus).reduce(
      (total, count) => total + count,
      0
    );

    return {
      ...job,
      views: viewsByJob.get(String(job._id)) ?? 0,
      applicants,
      byStatus,
    };
  });

  return {
    jobs: result,
    totals: result.reduce(
      (totals, job) => ({
        jobs: totals.jobs + 1,
        views: totals.views + job.views,
        applicants: totals.applicants + job.applicants,
      }),
      { jobs: 0, views: 0, applicants: 0 }
    ),
  };
};
