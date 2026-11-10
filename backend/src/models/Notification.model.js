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
        "connection_request",
        "connection_accepted",
        "new_follower",
        "company_recruiter_added",
        "company_verified",
        "company_verification_rejected",
        "company_suspended",
        "post_like",
        "post_comment",
        "post_moderation_warning",
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
    relatedConnectionId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedPostId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedCommentId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
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
