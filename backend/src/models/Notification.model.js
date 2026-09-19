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
  { timestamps: true }
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
