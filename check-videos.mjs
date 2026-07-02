import postgres from "postgres";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10 });
try {
  const movies = await sql`SELECT id, title, slug, video_url, thumbnail_url FROM movies WHERE video_url IS NOT NULL LIMIT 10`;
  console.log("Movies with video_url:", movies.length);
  for (const m of movies) {
    console.log("\n---", m.title, "(slug:", m.slug, ") ---");
    console.log("  video_url:", m.video_url);
    console.log("  thumbnail_url:", m.thumbnail_url);
  }
  const episodes = await sql`SELECT id, title, video_url FROM episodes WHERE video_url IS NOT NULL LIMIT 10`;
  console.log("\n\nEpisodes with video_url:", episodes.length);
  for (const e of episodes) {
    console.log("\n--- Episode", e.id, "---");
    console.log("  video_url:", e.video_url);
  }
} catch (e) { console.error("Error:", e.message); }
finally { await sql.end({ timeout: 3 }).catch(() => {}); }
