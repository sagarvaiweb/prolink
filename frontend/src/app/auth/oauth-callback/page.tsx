"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { setAccessToken } from "@/redux/features/auth/authSlice";
import { useGetCurrentUserQuery } from "@/redux/features/auth/authApi";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const accessToken = searchParams.get("accessToken");

  // Once we have the token, save it then fetch user data with it
  useEffect(() => {
    if (accessToken) {
      dispatch(setAccessToken(accessToken));
    } else {
      toast.error("Login failed. Please try again.");
      router.push("/auth/login");
    }
  }, [accessToken, dispatch, router]);

  // Fetches user info now that accessToken is in Redux (skip until we have one)
  const { data, isSuccess, isError } = useGetCurrentUserQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (isSuccess && data) {
      toast.success(`Welcome, ${data.data.firstName}!`);
      router.push("/dashboard");
    }
    if (isError) {
      toast.error("Something went wrong. Please try again.");
      router.push("/auth/login");
    }
  }, [isSuccess, isError, data, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Signing you in...</p>
    </div>
  );
}