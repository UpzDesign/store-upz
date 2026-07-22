import AdminWorkspaceShell from "@/components/AdminWorkspaceShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}
