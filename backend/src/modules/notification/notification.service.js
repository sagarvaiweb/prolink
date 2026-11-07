import { Notification } from "../../models/Notification.model.js";
import ApiError from "../../utils/ApiError.js";

const ensureActive = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }
};

const getPagination = ({ page = 1, limit = 20 }) => ({
  page: Number(page),
  limit: Number(limit),
  skip: (Number(page) - 1) * Number(limit),
});

export const createNotifications = async (notifications) => {
  if (!notifications.length) return;

  try {
    await Notification.insertMany(notifications, { ordered: false });
  } catch (error) {
    console.error("Could not create all job notifications.", error);
  }
};

export const notifyNewApplication = async ({
  applicant,
  recruiterId,
  job,
  application,
}) => {
  const applicantName = [applicant.firstName, applicant.lastName]
    .filter(Boolean)
    .join(" ");

  await createNotifications([
    {
      recipient: recruiterId,
      actor: applicant._id,
      type: "job_application_received",
      title: "New job application",
      message: `${applicantName || "A candidate"} applied for ${job.title}.`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
      jobTitle: job.title,
    },
  ]);
};

export const notifyApplicationStatus = async ({
  recruiter,
  applicantId,
  application,
  job,
}) => {
  await createNotifications([
    {
      recipient: applicantId,
      actor: recruiter._id,
      type: "application_status_updated",
      title: "Application status updated",
      message: `Your application for ${job.title} is now ${application.status}.`,
      relatedJobId: job._id,
      relatedApplicationId: application._id,
      jobTitle: job.title,
    },
  ]);
};

export const notifyJobRemoved = async ({ admin, job, applicantIds }) => {
  const recipientIds = new Set([String(job.postedBy), ...applicantIds.map(String)]);
  const message = `The job listing “${job.title}” was removed by an administrator.`;

  await createNotifications(
    [...recipientIds].map((recipient) => ({
      recipient,
      actor: admin._id,
      type: "job_listing_removed",
      title: "Job listing removed",
      message,
      relatedJobId: job._id,
      jobTitle: job.title,
    }))
  );
};

export const getMyNotifications = async (user, query) => {
  ensureActive(user);

  const { page, limit, skip } = getPagination(query);
  const filter = { recipient: user._id };
  if (query.unreadOnly) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate("actor", "firstName lastName username avatar")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: user._id, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const markNotificationRead = async (user, notificationId) => {
  ensureActive(user);

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );

  if (notification) return notification;

  const exists = await Notification.exists({
    _id: notificationId,
    recipient: user._id,
  });
  if (!exists) throw new ApiError(404, "Notification not found.");

  return Notification.findOne({ _id: notificationId, recipient: user._id });
};

export const markAllNotificationsRead = async (user) => {
  ensureActive(user);

  await Notification.updateMany(
    { recipient: user._id, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};
