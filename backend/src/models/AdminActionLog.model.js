import { Schema, model } from "mongoose";

const adminActionLogSchema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "report_dismissed",
        "post_removed",
        "user_warned",
        "user_suspended",
        "company_verified",
        "company_rejected",
        "company_suspended",
        "user_reactivated",
        "user_role_changed",
        "user_verification_changed",
        "user_status_changed",
        "user_deleted",
        "job_removed",
        "other",
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["user", "company", "post", "job"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminActionLogSchema.index({ createdAt: -1, _id: -1 });

export const AdminActionLog = model("AdminActionLog", adminActionLogSchema);
