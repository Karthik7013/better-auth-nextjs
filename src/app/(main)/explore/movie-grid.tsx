"use client";

import { forwardRef } from "react";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Film } from "lucide-react";
import Link from "next/link";

interface Movie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export default forwardRef(function MovieGrid(
  {
    movies,
    total,
    isLoading,
    isError,
    isAdmin,
  }: {
    movies: Movie[];
    total: number;
    isLoading: boolean;
    isError: boolean;
    isAdmin: boolean;
  },
  sentinelRef: React.Ref<HTMLDivElement>
) {
  const showError = !isLoading && isError && movies.length === 0;
  const showEmpty = !isLoading && !isError && movies.length === 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total > 0 ? `${total} movie${total === 1 ? "" : "s"} found` : ""}
        </p>
        {!isAdmin && (
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Film className="size-4" />
            Request a Movie
          </Link>
        )}
      </div>

      {showError ? (
        <p className="text-muted-foreground text-center py-12">
          Failed to load movies. Try again.
        </p>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No movies found</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Request it and we&apos;ll consider
            adding it.
          </p>
          {!isAdmin && (
            <Link
              href="/requests"
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Film className="size-4" />
              Request a Movie
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((m) => (
            <MovieCard key={m.id} {...m} />
          ))}
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={"skel-" + i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </>
  );
});
