CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_episodes_season_id" ON "episodes" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_favorites_user_id" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_favorites_movie_id" ON "favorites" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_requests_user_id" ON "movie_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_requests_status" ON "movie_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movie_tags_movie_id" ON "movie_tags" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movies_title_trgm" ON "movies" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movies_created_at" ON "movies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_movies_release_date" ON "movies" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_people_name" ON "people" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seasons_series_id" ON "seasons" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "user" USING btree ("role");
