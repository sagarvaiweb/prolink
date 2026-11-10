import AdminWorkspaceLayout from "@/components/admin/AdminWorkspaceLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminWorkspaceLayout>{children}</AdminWorkspaceLayout>;
}
