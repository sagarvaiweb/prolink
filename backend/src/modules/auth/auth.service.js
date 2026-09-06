import bcrypt from "bcrypt";
import { User } from "../../models/User.model.js";
import { OTP } from "../../models/OTP.model.js";
import ApiError from "../../utils/ApiError.js";
import { generateOTP, hashOTP, getOTPExpiry , compareOTP } from "../../utils/otp.util.js";
import { sendVerificationEmail } from "../../utils/email.util.js";

const SALT_ROUNDS = 10;

//  Registers a new user, generates an email verification OTP, and sends the OTP via email.
export const registerUser = async ({
  firstName,
  lastName,
  username,
  email,
  password,
  role,
}) => {
  //  Check for duplicate email or username
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, "Email is already registered.");
    }
    throw new ApiError(409, "Username is already taken.");
  }

  //  Hash the password (explicit — no model hook)
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  //  Create the user
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    role,
    provider: "local",
  });

  //  Generate OTP, save it, and email it — if ANY of this fails, roll back the user
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

  //  Return safe user data (never return password)
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

// Verifies a user's email using the provided OTP.
export const verifyEmail = async ({ email, otp }) => {
  //  Find the user
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User account not found.");
  }

  //  Already verified , No need to proceed
  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified.");
  }

  //  Find the latest, unused email_verification OTP for this user
  const otpDoc = await OTP.findOne({
    user: user._id,
    type: "email_verification",
    isUsed: false,
  }).sort({ createdAt: -1 });
 
  if (!otpDoc) {
    throw new ApiError(400, "Invalid or expired code.");
  }

  //  Check expiry
  if (otpDoc.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired code.");
  }

  //  Compare raw OTP against stored hash
  const isMatch = await compareOTP(otp, otpDoc.otp);
  if (!isMatch) {
    throw new ApiError(400, "Invalid or expired code.");
  }

  //  Mark user as verified 
  user.isEmailVerified = true;
  await user.save();

  //  Mark OTP as used
  otpDoc.isUsed = true;
  await otpDoc.save();

  return {
    _id: user._id,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
  };
};