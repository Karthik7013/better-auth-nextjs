"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";

async function fetchFavorites() {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Failed to fetch favorites");
  return res.json();
}

export function FavoritesContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  if (isError) {
    return <p className="text-muted-foreground text-center py-12">Failed to load favorites.</p>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const movies = data?.movies ?? [];

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Heart className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">No favorites yet</h3>
        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
          Start exploring and add movies to your favorites to see them here.
        </p>
        <Link href="/explore">
          <Button>
            <Search className="size-4 mr-2" />
            Browse Movies
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {movies.map((m: any) => (
        <MovieCard key={"fav-" + m.id} {...m} />
      ))}
    </div>
  );
}
