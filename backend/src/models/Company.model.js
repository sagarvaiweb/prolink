import { Schema, model } from "mongoose";

const normalizeName = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();

const companySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    nameKey: {
      type: String,
      required: true,
      select: false,
    },
    logo: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      required: true,
    },
    followerCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_document, company) {
        delete company.nameKey;
        return company;
      },
    },
    toObject: {
      transform(_document, company) {
        delete company.nameKey;
        return company;
      },
    },
  }
);

companySchema.pre("validate", function () {
  if (this.name) this.nameKey = normalizeName(this.name);
});

companySchema.index({ nameKey: 1 }, { unique: true });
companySchema.index({ isSuspended: 1, nameKey: 1 });

export const Company = model("Company", companySchema);
