"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import { useVerifyEmailMutation, useResendVerificationMutation } from "@/redux/features/auth/authApi";

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailForm() {
  const router = useRouter();

  // Grabs ?email  from the URL, set by RegisterForm's redirect
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();  

  // 6 separate boxes for the OTP digits , better UX than one plain input
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for the resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return; // only allow a single digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus the next box once a digit is typed
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Backspace on an empty box moves focus to the previous box
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    try {
      const res =await verifyEmail({ email, otp: otpString }).unwrap();
      toast.success(res?.data?.isEmailVerified ?  res?.message : "Email verified successfully!");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid or expired code. Please try again.");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      const res = await resendVerification({ email }).unwrap();
      toast.success(res?.message || "A new verification code has been sent to your email");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to resend code. Please try again");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Verify your email</h1>
      <p className="text-gray-500 mb-6">
        We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
            />
          ))}
        </div>

        <Button type="submit" isLoading={isVerifying} className="cursor-pointer">
          Verify email →
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Didn't get the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed hover:cursor-pointer"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </p>
    </div>
  );
}