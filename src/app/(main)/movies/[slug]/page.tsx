import { MovieDetailClient } from "./movie-detail-client";
import { getMovieBySlug, getRelatedMovies } from "@/services/movies";
import type { Metadata } from "next";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [movie] = await db
      .select({ title: movies.title })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);
    if (movie) {
      return { title: movie.title };
    }
  } catch {
    // fallback
  }
  return { title: "Movie" };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [movie, related] = await Promise.all([
    getMovieBySlug(slug),
    getRelatedMovies(slug),
  ]);

  return (
    <MovieDetailClient
      slug={slug}
      movie={movie}
      related={related}
    />
  );
}
