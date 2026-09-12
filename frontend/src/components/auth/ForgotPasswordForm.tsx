"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useForgotPasswordMutation } from "@/redux/features/auth/authApi";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res =await forgotPassword({ email }).unwrap();
      toast.success(res?.message || "A reset code has been sent to your email.");
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);

    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Forgot password?</h1>
      <p className="text-gray-500 mb-6">
        Enter your registered email and we'll send you a reset code.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<Mail size={16} />}
          type="email"
          name="email"
          placeholder="you@work.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isLoading} className="cursor-pointer">
          Send reset code →
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remember your password?{" "}
        <Link href="/auth/login" className="text-blue-800 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}