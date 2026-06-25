import { RequireAdmin } from "@/components/require-admin";
import { AdminLayout } from "@/components/admin-layout";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      <RequireAdmin>{children}</RequireAdmin>
    </AdminLayout>
  );
}
