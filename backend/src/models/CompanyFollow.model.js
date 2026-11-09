import { Schema, model } from "mongoose";

const companyFollowSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

companyFollowSchema.index({ company: 1, user: 1 }, { unique: true });
companyFollowSchema.index({ user: 1, createdAt: -1 });

export const CompanyFollow = model("CompanyFollow", companyFollowSchema);
