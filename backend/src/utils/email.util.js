import nodemailer from "nodemailer";
import ApiError from "./ApiError.js";

// Built fresh on every call (not at module load) so it always reads current env vars
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generic mail sender  , every other email function calls this
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"ProLink" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("SMTP ERROR:", error);
    throw new ApiError(500, "Failed to send email. Please try again.");
  }
};

// Sends the OTP for email verification after registration
export const sendVerificationEmail = async (toEmail, firstName, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>Welcome to ProLink, ${firstName}!</h2>
      <p>Use the code below to verify your email address. This code expires in 10 minutes.</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f4f4f4; padding: 16px; text-align: center; border-radius: 8px;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 13px; margin-top: 16px;">
        If you didn't create a ProLink account, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: toEmail,
    subject: "Verify your ProLink account",
    html,
  });
};