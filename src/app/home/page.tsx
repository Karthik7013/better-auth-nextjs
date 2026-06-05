import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { HomeContent } from "./home-content";
import { ProfileMenu } from "@/components/profile-menu";

export default async function HomePage() {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    redirect("/login");
  }
  if (!session) redirect("/login");

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        <DashboardHeader title="StreamFlix" right={<ProfileMenu />} />
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <HomeContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
