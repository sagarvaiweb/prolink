"use client";
import { useGetCurrentUserQuery } from "@/redux/features/auth/authApi";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useGetCurrentUserQuery();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }
  return <>{children}</>;
}