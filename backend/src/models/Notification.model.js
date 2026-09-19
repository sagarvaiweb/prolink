import mongoose, { Schema } from "mongoose";

export const NOTIFICATION_TYPES = Object.freeze({
  CONNECTION_REQUEST_RECEIVED: "connection_request_received",
  CONNECTION_REQUEST_ACCEPTED: "connection_request_accepted",
  CONNECTION_REQUEST_REJECTED: "connection_request_rejected",
  FOLLOW_RECEIVED: "follow_received",
});

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },
    connection: {
      type: Schema.Types.ObjectId,
      ref: "Connection",
      required: function () {
        return this.type !== NOTIFICATION_TYPES.FOLLOW_RECEIVED;
      },
      default: null,
    },
    follow: {
      type: Schema.Types.ObjectId,
      ref: "Follow",
      required: function () {
        return this.type === NOTIFICATION_TYPES.FOLLOW_RECEIVED;
      },
      default: null,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  // Indexes are created explicitly after legacy-index migration in connectDB.
  { timestamps: true, autoIndex: false }
);

// One recipient can receive each connection event only once.
notificationSchema.index(
  { recipient: 1, type: 1, connection: 1 },
  {
    unique: true,
    partialFilterExpression: { connection: { $type: "objectId" } },
  }
);

// One recipient can receive each follow event only once.
notificationSchema.index(
  { recipient: 1, type: 1, follow: 1 },
  {
    unique: true,
    partialFilterExpression: { follow: { $type: "objectId" } },
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);

const isExpectedPartialUniqueIndex = (index, field) =>
  index.unique === true &&
  index.partialFilterExpression?.[field]?.$type === "objectId";

// Replaces only legacy full unique indexes that treat null references as events.
// Existing notifications are preserved; only incompatible index definitions change.
export const ensureNotificationIndexes = async () => {
  const indexes = await Notification.collection.indexes();
  const eventFields = ["connection", "follow"];

  for (const field of eventFields) {
    const matchingIndexes = indexes.filter((index) =>
      Object.keys(index.key).length === 3 &&
      index.key.recipient === 1 &&
      index.key.type === 1 &&
      index.key[field] === 1
    );

    for (const index of matchingIndexes) {
      if (!isExpectedPartialUniqueIndex(index, field)) {
        await Notification.collection.dropIndex(index.name);
      }
    }
  }

  await Notification.createIndexes();
};
