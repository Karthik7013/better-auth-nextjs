import { NumberSVG } from "@/components/number-svg";
import Image from "next/image";
import Link from "next/link";
import type { HomeMovie } from "./types";

export default function RecentMovies({ movies }: { movies: HomeMovie[] }) {
  if (movies.length === 0) return <>no recently added movies</>;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
      <div className="flex gap-2 overflow-x-auto pb-4 pl-4 snap-x snap-mandatory scroll-pl-4">
        {movies.map((movie, index) => {
          const number = index + 1;
          return (
            <Link
              key={"ra-" + movie.id}
              href={`/movies/${movie.slug}`}
              className="group shrink-0 snap-start"
            >
              <div className="flex items-center">
                <NumberSVG
                  number={number}
                  className="shrink-0 h-64 w-auto text-foreground/90 relative z-0"
                />
                <div className="relative z-10 w-44 shrink-0 -ml-16">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-lg transition-transform group-hover:scale-105">
                    <Image
                      src={movie.thumbnailUrl}
                      alt={movie.title}
                      fill
                      sizes="176px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground truncate pl-2">
                {movie.title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
