import { PostReport } from "../../models/PostReport.model.js";
import ApiError from "../../utils/ApiError.js";
import { getPostById, removePostByAdmin } from "./post.service.js";

const REPORT_POPULATE = [
  {
    path: "post",
    populate: { path: "author", select: "firstName lastName username avatar role" },
  },
  {
    path: "reporter",
    select: "firstName lastName username avatar role",
  },
  {
    path: "reviewedBy",
    select: "firstName lastName username avatar role",
  },
];

const ensureActiveAdmin = (admin) => {
  if (admin.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active");
  }
};

export const reportPost = async (reporter, postId, reportData) => {
  const post = await getPostById(reporter, postId);
  if (String(post.author._id) === String(reporter._id)) {
    throw new ApiError(400, "You cannot report your own post.");
  }

  try {
    return await PostReport.create({
      post: post._id,
      reporter: reporter._id,
      reason: reportData.reason,
      details: reportData.details,
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "You have already reported this post.");
    }
    throw error;
  }
};

export const getPostReports = async (admin, { page = 1, limit = 10 }) => {
  ensureActiveAdmin(admin);
  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;
  const filter = { status: "pending" };
  const [reports, total] = await Promise.all([
    PostReport.find(filter)
      .populate(REPORT_POPULATE)
      .sort({ createdAt: 1, _id: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    PostReport.countDocuments(filter),
  ]);

  return {
    reports,
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const reviewPostReport = async (admin, reportId, status) => {
  ensureActiveAdmin(admin);
  const report = await PostReport.findOne({ _id: reportId, status: "pending" });
  if (!report) {
    throw new ApiError(404, "Pending post report not found.");
  }

  if (status === "post_removed") {
    await removePostByAdmin(report.post);
  }

  const reviewedReport = await PostReport.findOneAndUpdate(
    { _id: report._id, status: "pending" },
    {
      $set: {
        status,
        reviewedBy: admin._id,
        reviewedAt: new Date(),
      },
    },
    { new: true }
  ).populate(REPORT_POPULATE);

  if (!reviewedReport) {
    throw new ApiError(409, "This post report was already reviewed.");
  }

  return reviewedReport;
};
