import { db } from "@/db";
import { movies, tags, user } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminDashboard() {
  const [totalMovies] = await db.select({ value: count() }).from(movies);
  const [totalTags] = await db.select({ value: count() }).from(tags);
  const [totalUsers] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "user"));
  const [totalAdmins] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "admin"));
  const recentMovies = await db
    .select({ id: movies.id, title: movies.title, createdAt: movies.createdAt })
    .from(movies)
    .orderBy(desc(movies.createdAt))
    .limit(5);

  const stats = [
    { label: "Total Movies", value: totalMovies.value },
    { label: "Total Tags", value: totalTags.value },
    { label: "Total Users", value: totalUsers.value },
    { label: "Total Admins", value: totalAdmins.value },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your site metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Movies</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {recentMovies.map((movie) => (
                  <tr key={movie.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{movie.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {movie.createdAt?.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentMovies.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                      No movies yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
