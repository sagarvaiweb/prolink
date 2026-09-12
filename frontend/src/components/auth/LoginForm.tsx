"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import { LoginPayload } from "@/types/auth.types";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState<LoginPayload>({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await login(formData).unwrap();
      router.push("/dashboard");
      toast.success(res?.message || "Login successful. Redirecting to dashboard...");

    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    // Outer boundary matching RegisterForm to block compression layout errors
    <div className="w-full max-w-md mx-auto block px-4 py-8">
      
        {/* Switcher Tab Layout Header */}
      <div className="flex gap-2 mb-8 bg-gray-100 rounded-lg p-1 w-fit border border-gray-200/60 shadow-inner">
        <span className="px-4 py-1.5 rounded-md bg-white shadow-sm text-sm font-semibold text-blue-800">
          Sign in
        </span>
        <Link
          href="/auth/register"
          className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Create account
        </Link>
      </div>

        {/* Typography Groups */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
        Welcome back
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        Sign in to pick up where you left off.
      </p>

      

      {/* Form Grid Pipeline */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        
        {/* Email Entry Container */}
        <div className="w-full relative min-h-12.5">
          <Input
            icon={<Mail size={16} />}
            type="email"
            name="email"
            placeholder="you@work.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="h-12 w-full block"
          />
        </div>

        {/* Password Entry Container */}
        <div className="w-full relative min-h-12.5">
          <Input
            icon={<Lock size={16} />}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required 
            className="h-12 w-full block"
          />
        </div>

        {/* Action Checkboxes & Anchor Links */}
        <div className="flex items-center justify-end text-sm py-1 select-none">
          
          <Link 
            href="/auth/forgot-password" 
            className="text-blue-800 font-semibold hover:underline transition-all text-sm"
          >
            Forgot password?
          </Link>
        </div>

        {/* Action Submission Button Wrap */}
        <div className="w-full pt-2">
          <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full h-12 cursor-pointer flex items-center justify-center bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg shadow transition-transform active:scale-[0.99]">
            Sign in &rarr;
          </Button> 
        </div>
      </form>

      {/* Alternate Options Redirect Anchor Footer */}
      <p className="text-center text-sm text-gray-500 mt-8 font-medium">
        New to ProLink?{" "}
        <Link 
          href="/auth/register" 
          className="text-blue-800 hover:underline font-semibold"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
