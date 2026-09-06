import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      select: false, // never returned by default in queries
    },
    provider: {
      type: String,
      enum: ["local", "google", "github" , "linkedin"],
      default: "local",
    },
    providerId: {
      type: String,
      default: null, // only set for OAuth users
    },
    role: {
      type: String,
      enum: ["student", "professional", "recruiter", "admin"],
      required: [true, "Role is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false, // admin-verified recruiters
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended", "deleted"],
      default: "active",
    },
    avatar: {
      type: String,
      default: "https://res.cloudinary.com/demo/image/upload/default-avatar.png",
    },
    refreshToken: {
      type: String,
      default: null, // stored hashed
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastPasswordChangedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

export const User = mongoose.model("User", userSchema);