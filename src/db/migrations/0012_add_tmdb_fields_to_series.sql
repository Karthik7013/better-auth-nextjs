ALTER TABLE "series" ADD COLUMN "trailer_url" text;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "tmdb_id" integer;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "original_language" varchar(10);--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_tmdb_id_unique" UNIQUE("tmdb_id");