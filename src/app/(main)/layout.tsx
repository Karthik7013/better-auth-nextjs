import { DashboardLayout } from "@/components/dashboard-layout";
import { RequireAuth } from "@/components/require-auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RequireAuth>
  )
}
