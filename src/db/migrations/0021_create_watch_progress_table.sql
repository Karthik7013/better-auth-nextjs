CREATE TABLE "watch_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"movie_id" integer REFERENCES "movies"("id") ON DELETE CASCADE,
	"episode_id" integer REFERENCES "episodes"("id") ON DELETE CASCADE,
	"progress_seconds" integer NOT NULL DEFAULT 0,
	"duration_seconds" integer NOT NULL DEFAULT 0,
	"completed" boolean NOT NULL DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_watch_progress_user_id" ON "watch_progress" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watch_progress_user_updated" ON "watch_progress" ("user_id", "updated_at" DESC);--> statement-breakpoint
CREATE INDEX "idx_watch_progress_movie_id" ON "watch_progress" ("movie_id");--> statement-breakpoint
CREATE INDEX "idx_watch_progress_episode_id" ON "watch_progress" ("episode_id");
