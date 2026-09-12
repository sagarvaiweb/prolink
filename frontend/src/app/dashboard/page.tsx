import ProtectedRoute from "@/components/layout/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Welcome to your dashboard!</h1>
      </div>
    </ProtectedRoute>
  );
}