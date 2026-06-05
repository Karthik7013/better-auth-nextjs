import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { MovieDetailContent } from "./movie-detail-content";

export default async function MoviePage() {
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
        <DashboardHeader title="" />
        <div className="flex-1 overflow-y-auto p-4">
          <MovieDetailContent />
        </div>
      </div>
    </DashboardLayout>
  );
}
