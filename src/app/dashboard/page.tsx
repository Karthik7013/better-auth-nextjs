import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function DashboardPage() {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        <DashboardHeader title="My Organization" />
        <div className="flex-1 overflow-y-auto p-4">
        </div>
      </div>
    </DashboardLayout>
  );
}
