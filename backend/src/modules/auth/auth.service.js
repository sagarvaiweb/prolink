import bcrypt from "bcrypt";
import { User } from "../../models/User.model.js";
import { OTP } from "../../models/OTP.model.js";
import ApiError from "../../utils/ApiError.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../../utils/otp.util.js";
import { sendVerificationEmail } from "../../utils/email.util.js";

const SALT_ROUNDS = 10;

export const registerUser = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  role,
}) => {
  // 1. Check for duplicate email or username
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, "Email is already registered.");
    }
    throw new ApiError(409, "Username is already taken.");
  }

  // 2. Hash the password (explicit — no model hook)
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create the user
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    role,
    provider: "local",
  });

  // 4. Generate OTP, save it, and email it — if ANY of this fails, roll back the user
  try {
    const rawOTP = generateOTP();
    const hashedOTP = await hashOTP(rawOTP);

    await OTP.create({
      user: user._id,
      otp: hashedOTP,
      type: "email_verification",
      expiresAt: getOTPExpiry(),
    });

    await sendVerificationEmail(user.email, user.firstName, rawOTP);
  } catch (err) {
    // Roll back: undo user creation so no broken/stuck account is left behind
    await User.findByIdAndDelete(user._id);
    await OTP.deleteMany({ user: user._id }); // clean up any OTP that did get created
    throw new ApiError(
      500,
      "Failed to send verification email. Please try registering again."
    );
  }

  // 5. Return safe user data (never return password)
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
};