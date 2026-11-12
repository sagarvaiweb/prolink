import { PostReport } from "../../models/PostReport.model.js";
import { Post } from "../../models/Post.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import { getPostById, removePostByAdmin } from "./post.service.js";
import { logAdminAction } from "../admin/actionLog.service.js";
import { notifyPostModerationWarning } from "../notification/notification.service.js";

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

export const getPostReports = async (
  admin,
  { page = 1, limit = 10, status = "pending" }
) => {
  ensureActiveAdmin(admin);
  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;
  const filter = { status };
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

const LEGACY_STATUS_TO_ACTION = {
  dismissed: "dismiss",
  post_removed: "remove_content",
};

export const reviewPostReport = async (admin, reportId, requestedAction, note = "") => {
  ensureActiveAdmin(admin);
  const action = LEGACY_STATUS_TO_ACTION[requestedAction] ?? requestedAction;
  const reviewedAt = new Date();
  const report = await PostReport.findOneAndUpdate(
    { _id: reportId, status: "pending", reviewedAt: null },
    { $set: { reviewedBy: admin._id, reviewedAt } },
    { returnDocument: "after" }
  );
  if (!report) {
    const exists = await PostReport.exists({ _id: reportId });
    if (!exists) throw new ApiError(404, "Post report not found.");
    const busy = await PostReport.exists({ _id: reportId, status: "pending" });
    if (busy) throw new ApiError(409, "This post report is already being reviewed.");
    throw new ApiError(404, "Pending post report not found.");
  }

  let finalStatus;
  let logTargetType = "post";
  let logTargetId = report.post;
  let logAction;

  try {
    if (action === "dismiss") {
      finalStatus = "dismissed";
      logAction = "report_dismissed";
    } else if (action === "remove_content") {
      const removed = await removePostByAdmin(report.post);
      if (!removed) {
        throw new ApiError(409, "This post has already been removed.");
      }
      finalStatus = "post_removed";
      logAction = "post_removed";
    } else if (action === "warn_user") {
      const post = await Post.findById(report.post).select("_id author").lean();
      if (!post) throw new ApiError(409, "This post has already been removed.");
      await notifyPostModerationWarning({
        admin,
        userId: post.author,
        postId: post._id,
      });
      finalStatus = "actioned";
      logAction = "user_warned";
    } else if (action === "suspend_author") {
      const post = await Post.findById(report.post).select("_id author").lean();
      if (!post) throw new ApiError(409, "This post has already been removed.");
      const author = await User.findById(post.author).select("_id role accountStatus");
      if (!author) throw new ApiError(404, "Post author account not found.");
      if (author.role === "admin") {
        throw new ApiError(403, "An administrator cannot be suspended through post moderation.");
      }
      if (author.accountStatus !== "suspended") {
        author.accountStatus = "suspended";
        await author.save();
      }
      finalStatus = "actioned";
      logAction = "user_suspended";
      logTargetType = "user";
      logTargetId = author._id;
    } else if (action === "suspend_reporter") {
      const reporter = await User.findById(report.reporter).select("_id role accountStatus");
      if (!reporter) throw new ApiError(404, "Report author account not found.");
      if (reporter.role === "admin") {
        throw new ApiError(403, "An administrator cannot be suspended from a report action.");
      }
      if (reporter.accountStatus !== "suspended") {
        reporter.accountStatus = "suspended";
        await reporter.save();
      }
      finalStatus = "actioned";
      logAction = "user_suspended";
      logTargetType = "user";
      logTargetId = reporter._id;
    } else {
      throw new ApiError(400, "Invalid moderation action.");
    }

    await logAdminAction({
      admin,
      action: logAction,
      targetType: logTargetType,
      targetId: logTargetId,
      note: `Report ${report._id}${note ? `; ${note}` : ""}`.slice(0, 500),
    });

    const reviewedReport = await PostReport.findOneAndUpdate(
      { _id: report._id, status: "pending", reviewedBy: admin._id, reviewedAt },
      { $set: { status: finalStatus, action } },
      { returnDocument: "after" }
    ).populate(REPORT_POPULATE);

    if (!reviewedReport) {
      throw new ApiError(409, "This post report was already reviewed.");
    }
    return reviewedReport;
  } catch (error) {
    await PostReport.updateOne(
      { _id: report._id, status: "pending", reviewedBy: admin._id, reviewedAt },
      { $set: { reviewedBy: null, reviewedAt: null } }
    );
    throw error;
  }
};
