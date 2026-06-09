import { MovieDetailContent } from "./movie-detail-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movie",
};

export default async function MoviePage() {
  return <MovieDetailContent />;
}
