CREATE TABLE "featured_series" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "featured_series" ADD CONSTRAINT "featured_series_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_featured_series_series_id" ON "featured_series" USING btree ("series_id");