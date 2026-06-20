import { DashboardLayout } from "@/components/dashboard-layout";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
