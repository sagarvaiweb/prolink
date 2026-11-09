import { Schema, model } from "mongoose";

const jobSchema = new Schema(
  {
    // postedBy is retained for records created before company posting existed.
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.postedByCompany;
      },
    },
    postedByCompany: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: function () {
        return !this.postedBy;
      },
    },
    postedByUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return Boolean(this.postedByCompany);
      },
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    requiredSkills: {
      type: [{ type: String, trim: true, maxlength: 50 }],
      required: true,
      validate: {
        validator: (skills) => skills.length > 0 && skills.length <= 20,
        message: "Provide between 1 and 20 required skills.",
      },
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior"],
      required: true,
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      required: true,
    },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    isRemote: { type: Boolean, default: false },
    salaryRange: { type: String, trim: true, maxlength: 100, default: null },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    moderationNote: { type: String, trim: true, maxlength: 500, default: null },
    applicantCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1, _id: -1 });
jobSchema.index({ postedByCompany: 1, status: 1, createdAt: -1 });
jobSchema.index({ postedByUser: 1, createdAt: -1 });
jobSchema.index({ requiredSkills: 1, status: 1 });
jobSchema.index({ jobType: 1, experienceLevel: 1, status: 1 });

export const Job = model("Job", jobSchema);
