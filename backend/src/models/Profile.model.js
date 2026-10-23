import mongoose, { Schema } from "mongoose";

const experienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  isCurrent: { type: Boolean, default: false },
  description: { type: String },
});

const educationSchema = new Schema({
  school: { type: String, required: true },
  degree: { type: String },
  fieldOfStudy: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
});

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one-to-one with User
    },
    headline: { type: String, maxlength: 100 },
    bio: { type: String, maxlength: 500 },
    location: { type: String },
    coverPhoto: { type: String, default: null },
    resumeUrl: { type: String, default: null },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "connections", "private"],
      default: "public",
    },
    profileCompletion: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Profile =  mongoose.model("Profile", profileSchema);