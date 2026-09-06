import crypto from "crypto";
import bcrypt from "bcrypt";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const SALT_ROUNDS = 10;


  // Generates a random numeric OTP as a string (e.g. "482913")
 
export const generateOTP = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return crypto.randomInt(min, max).toString();
};


  // Hashes a raw OTP before storing it in the DB.
 
export const hashOTP = async (rawOTP) => {
  return bcrypt.hash(rawOTP, SALT_ROUNDS);
};


  // Compares a raw OTP (user input) against the stored hash.
  // Returns true/false.
 
export const compareOTP = async (rawOTP, hashedOTP) => {
  return bcrypt.compare(rawOTP, hashedOTP);
};


  // Returns a Date object OTP_EXPIRY_MINUTES from now.
  // Use this to set OTP.expiresAt when creating an OTP document.
 
export const getOTPExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

export { OTP_EXPIRY_MINUTES };