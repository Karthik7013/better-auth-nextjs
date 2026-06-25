import { MovieCard } from "@/components/movie-card";

interface RelatedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export function RelatedMovies({ related }: { related: RelatedMovie[] }) {
  if (related.length === 0) return null;

  return (
    <section className="pt-4">
      <h2 className="text-xl font-semibold mb-4">Related Movies</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {related.map((m) => (
          <div key={m.id} className="shrink-0 w-48">
            <MovieCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
}
