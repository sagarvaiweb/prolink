import {
  Notification,
  NOTIFICATION_TYPES,
} from "../../models/Notification.model.js";
import ApiError from "../../utils/ApiError.js";

const SAFE_USER_PROFILE_FIELDS = "firstName lastName username role avatar";

const getPaginationValues = ({ page = 1, limit = 10 }) => {
  const currentPage = Number(page);
  const pageSize = Number(limit);

  return {
    currentPage,
    pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

const safeProfile = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
  };
};

const safeNotification = (notification) => ({
  _id: notification._id,
  actor: safeProfile(notification.actor),
  type: notification.type,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

const CONNECTION_NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.CONNECTION_REQUEST_RECEIVED]:
    "You received a connection request.",
  [NOTIFICATION_TYPES.CONNECTION_REQUEST_ACCEPTED]:
    "Your connection request was accepted.",
  [NOTIFICATION_TYPES.CONNECTION_REQUEST_REJECTED]:
    "Your connection request was rejected.",
};

const FOLLOW_NOTIFICATION_MESSAGES = {
  [NOTIFICATION_TYPES.FOLLOW_RECEIVED]: "You have a new follower.",
};

const createNotification = async ({
  recipient,
  actor,
  type,
  message,
  connection = null,
  follow = null,
}) => {
  const eventReference = connection ? { connection } : { follow };

  return Notification.findOneAndUpdate(
    { recipient, type, ...eventReference },
    {
      $setOnInsert: {
        recipient,
        actor,
        type,
        connection,
        follow,
        message,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
};

// Creates one notification per recipient, connection, and event type.
export const createConnectionNotification = async ({
  recipient,
  actor,
  type,
  connection,
}) => {
  const message = CONNECTION_NOTIFICATION_MESSAGES[type];

  return createNotification({ recipient, actor, type, connection, message });
};

// Creates one notification per recipient, follow relationship, and event type.
export const createFollowNotification = async ({
  recipient,
  actor,
  type,
  follow,
}) => {
  const message = FOLLOW_NOTIFICATION_MESSAGES[type];

  return createNotification({ recipient, actor, type, follow, message });
};

// Lists notifications belonging to the authenticated recipient.
export const getNotifications = async (userId, { page = 1, limit = 10 }) => {
  const { currentPage, pageSize, skip } = getPaginationValues({ page, limit });
  const notificationFilter = { recipient: userId };

  const notificationsQuery = Notification.find(notificationFilter)
    .populate("actor", SAFE_USER_PROFILE_FIELDS)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const [notifications, totalNotifications] = await Promise.all([
    notificationsQuery,
    Notification.countDocuments(notificationFilter),
  ]);

  return {
    notifications: notifications.map(safeNotification),
    pagination: {
      currentPage,
      limit: pageSize,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / pageSize),
    },
  };
};

// Counts unread notifications belonging to the authenticated recipient.
export const getUnreadNotificationCount = async (userId) => {
  const count = await Notification.countDocuments({ recipient: userId, isRead: false });

  return { count };
};

// Marks a notification as read only when it belongs to the authenticated recipient.
export const markNotificationAsRead = async (userId, { notificationId }) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true } },
    { new: true }
  ).populate("actor", SAFE_USER_PROFILE_FIELDS);

  if (!notification) {
    throw new ApiError(404, "Notification not found.");
  }

  return safeNotification(notification);
};
