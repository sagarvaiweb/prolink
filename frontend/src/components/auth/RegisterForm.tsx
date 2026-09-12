"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, AtSign } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { RegisterPayload } from "@/types/auth.types";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState<RegisterPayload>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    role: "student",
  });


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   

    try {
      const res = await register(formData).unwrap();
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      toast.success(res?.message || "Registration successful. Please verify your email.");

    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto block px-4 py-8">
      
      {/* Dynamic Selector Header Tabs */}
      <div className="flex gap-2 mb-8 bg-gray-100 rounded-lg p-1 w-fit border border-gray-200/60 shadow-inner">
        <Link
          href="/auth/login"
          className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign in
        </Link>
        <span className="px-4 py-1.5 rounded-md bg-white shadow-sm text-sm font-semibold text-blue-800">
          Create account
        </span>
      </div>

      {/* Heading Text Blocks */}
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
        Create your account
      </h1>
      <p className="text-gray-500 mb-6 text-sm">
        Join thousands of professionals on ProLink.
      </p>

      

      {/* Safe Form Interface Group */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        
        {/* First & Last Name Side-by-Side Flex Layout */}
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="w-full relative min-h-12.5">
            <Input
              icon={<User size={16} />}
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="h-12 w-full block"
            />
          </div>
          <div className="w-full relative min-h-12.5">
            <Input
              icon={<User size={16} />}
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="h-12 w-full block"
            />
          </div>
        </div>

        {/* Username Field */}
        <div className="w-full relative min-h-12.5">
          <Input
            icon={<AtSign size={16} />}
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="h-12 w-full block"
          />
        </div>

        {/* Email Field */}
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

        {/* Password Field */}
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

        {/* Role Control Dropdown Wrapper */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
            Select Account Type
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 h-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-800 transition-all shadow-sm cursor-pointer"
          >
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>

        {/* Action Button Container */}
        <div className="w-full pt-2">
          <Button type="submit" isLoading={isLoading} className="w-full h-12 cursor-pointer flex items-center justify-center bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg shadow transition-transform active:scale-[0.99]">
            Create account &rarr;
          </Button>
        </div>
      </form>

      {/* Alternative View Redirect */}
      <p className="text-center text-sm text-gray-500 mt-6 font-medium">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-800 hover:underline font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
