CREATE TABLE "movie_cast" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"character_name" varchar(255) NOT NULL,
	"order_billing" integer,
	CONSTRAINT "movie_cast_movie_id_person_id_character_name_pk" PRIMARY KEY("movie_id","person_id","character_name")
);
--> statement-breakpoint
CREATE TABLE "movie_crew" (
	"movie_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"department" varchar(100) NOT NULL,
	"job" varchar(100) NOT NULL,
	CONSTRAINT "movie_crew_movie_id_person_id_department_job_pk" PRIMARY KEY("movie_id","person_id","department","job")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"profile_url" text
);
--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "tmdb_id" integer;--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "original_language" varchar(10);--> statement-breakpoint
ALTER TABLE "movies" ADD COLUMN "backdrop_url" text;--> statement-breakpoint
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_cast" ADD CONSTRAINT "movie_cast_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_crew" ADD CONSTRAINT "movie_crew_movie_id_movies_id_fk" FOREIGN KEY ("movie_id") REFERENCES "public"."movies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_crew" ADD CONSTRAINT "movie_crew_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movies" ADD CONSTRAINT "movies_tmdb_id_unique" UNIQUE("tmdb_id");