import { Notification } from "../../models/Notification.model.js";
import ApiError from "../../utils/ApiError.js";
import { emitNotificationToUser } from "../../config/socket.js";

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
  if (!notifications?.length) return [];

  try {
    const createdNotifications = await Notification.insertMany(notifications, {
      ordered: false,
    });
    createdNotifications.forEach((notification) =>
      emitNotificationToUser(notification.recipient, notification.toObject())
    );
    return createdNotifications;
  } catch (error) {
    console.error("Could not create notifications.", error);
    const insertedNotifications = error.insertedDocs ?? [];
    insertedNotifications.forEach((notification) =>
      emitNotificationToUser(notification.recipient, notification.toObject())
    );
    return insertedNotifications;
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

export const notifyConnectionRequest = async ({ requester, recipientId, connection }) => {
  const requesterName = [requester.firstName, requester.lastName]
    .filter(Boolean)
    .join(" ");

  await createNotifications([
    {
      recipient: recipientId,
      actor: requester._id,
      type: "connection_request",
      title: "New connection request",
      message: `${requesterName || "A user"} sent you a connection request.`,
      relatedConnectionId: connection._id,
    },
  ]);
};

export const notifyConnectionAccepted = async ({ accepter, requesterId, connection }) => {
  const accepterName = [accepter.firstName, accepter.lastName]
    .filter(Boolean)
    .join(" ");

  await createNotifications([
    {
      recipient: requesterId,
      actor: accepter._id,
      type: "connection_accepted",
      title: "Connection request accepted",
      message: `${accepterName || "A user"} accepted your connection request.`,
      relatedConnectionId: connection._id,
    },
  ]);
};

export const notifyNewFollower = async ({ follower, recipientId }) => {
  const followerName = [follower.firstName, follower.lastName]
    .filter(Boolean)
    .join(" ");

  await createNotifications([
    {
      recipient: recipientId,
      actor: follower._id,
      type: "new_follower",
      title: "New follower",
      message: `${followerName || "A user"} started following you.`,
    },
  ]);
};

export const notifyCompanyMemberAdded = async ({
  addedBy,
  memberId,
  memberRole,
  company,
}) => {
  const actorName = [addedBy.firstName, addedBy.lastName]
    .filter(Boolean)
    .join(" ");

  await createNotifications([
    {
      recipient: memberId,
      actor: addedBy._id,
      type: "company_recruiter_added",
      title: "Added to a company team",
      message: `${actorName || "A company manager"} added you as ${memberRole === "admin" ? "a company admin" : "a recruiter"} to ${company.name}.`,
      relatedCompanyId: company._id,
    },
  ]);
};

export const notifyCompanyStatusChanged = async ({
  admin,
  company,
  memberIds,
  isVerified,
}) => {
  const type = isVerified ? "company_verified" : "company_suspended";
  const title = isVerified ? "Company verified" : "Company suspended";
  const message = isVerified
    ? `${company.name} has been verified and can post jobs.`
    : `${company.name} has been suspended and can no longer post jobs.`;

  await createNotifications(
    [...new Set(memberIds.map(String))].map((memberId) => ({
      recipient: memberId,
      actor: admin._id,
      type,
      title,
      message,
      relatedCompanyId: company._id,
    }))
  );
};

export const notifyPostLike = async ({ actor, post }) => {
  const recipientId = post.author?._id ?? post.author;
  if (String(recipientId) === String(actor._id)) return;

  const actorName = [actor.firstName, actor.lastName].filter(Boolean).join(" ");
  await createNotifications([
    {
      recipient: recipientId,
      actor: actor._id,
      type: "post_like",
      title: "New post like",
      message: `${actorName || "Someone"} liked your post.`,
      relatedPostId: post._id,
    },
  ]);
};

export const notifyPostComment = async ({ actor, post, comment }) => {
  const recipientId = post.author?._id ?? post.author;
  if (String(recipientId) === String(actor._id)) return;

  const actorName = [actor.firstName, actor.lastName].filter(Boolean).join(" ");
  await createNotifications([
    {
      recipient: recipientId,
      actor: actor._id,
      type: "post_comment",
      title: "New comment on your post",
      message: `${actorName || "Someone"} commented on your post.`,
      relatedPostId: post._id,
      relatedCommentId: comment._id,
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
  const jobPosterId = job.postedByUser ?? job.postedBy;
  const recipientIds = new Set([
    ...(jobPosterId ? [String(jobPosterId)] : []),
    ...applicantIds.map(String),
  ]);
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
    { returnDocument: "after" }
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

export const getUnreadNotificationCount = async (user) => {
  ensureActive(user);
  return Notification.countDocuments({ recipient: user._id, isRead: false });
};

export const deleteNotification = async (user, notificationId) => {
  ensureActive(user);

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: user._id,
  });

  if (!notification) throw new ApiError(404, "Notification not found.");
};
