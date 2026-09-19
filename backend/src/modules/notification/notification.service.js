import {
  Notification,
  NOTIFICATION_TYPES,
} from "../../models/Notification.model.js";

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
