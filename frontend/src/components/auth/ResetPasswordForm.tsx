"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, KeyRound } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Grabs ?email=... from the URL , set by ForgotPasswordForm's redirect
  const email = searchParams.get("email") || "";

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend-side check before even hitting the backend , to save a round trip if the user mistypes their password
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      // Matches backend's resetPassword({ email, otp, newPassword }) exactly
     const res = await resetPassword({
        email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      }).unwrap();

      toast.success(res?.message || "Password reset successful. You can now log in with your new password.");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid or expired code. Please try again.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Reset your password</h1>
      <p className="text-gray-500 mb-6">
        Enter the code sent to{" "}
        <span className="font-medium text-gray-900">{email}</span> and choose
        a new password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<KeyRound size={16} />}
          name="otp"
          placeholder="6-digit code"
          maxLength={6}
          value={formData.otp}
          onChange={handleChange}
          required
        />
        <Input
          icon={<Lock size={16} />}
          type="password"
          name="newPassword"
          placeholder="New password"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />
        <Input
          icon={<Lock size={16} />}
          type="password"
          name="confirmPassword"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        <Button type="submit" isLoading={isLoading}>
          Reset password →
        </Button>
      </form>
    </div>
  );
}