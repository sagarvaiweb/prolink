import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true, // stored HASHED, never raw
    },
    type: {
      type: String,
      enum: ["email_verification", "forgot_password"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true, // set as createdAt + 10 min via otp.util.js
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // only need createdAt per spec
);

// Auto-delete expired OTP documents once expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model("OTP", otpSchema);