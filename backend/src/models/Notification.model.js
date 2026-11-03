import { Schema, model } from "mongoose";

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
      default: null,
    },
    type: {
      type: String,
      enum: [
        "job_application_received",
        "application_status_updated",
        "job_listing_removed",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    relatedJobId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedApplicationId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = model("Notification", notificationSchema);
