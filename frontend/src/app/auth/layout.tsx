import AuthBrandPanel from "@/components/auth/AuthBrandPanel";

// This layout wraps evert page inside app/auth/ (login, register,etc)
// Next.js applies this automatically based on folder structure.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel />
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}  