import { Schema, model } from "mongoose";

const companyMemberSchema = new Schema(
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
    role: {
      type: String,
      enum: ["owner", "admin", "recruiter"],
      default: "recruiter",
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

companyMemberSchema.index({ company: 1, user: 1 }, { unique: true });
companyMemberSchema.index({ user: 1, role: 1 });

export const CompanyMember = model("CompanyMember", companyMemberSchema);
