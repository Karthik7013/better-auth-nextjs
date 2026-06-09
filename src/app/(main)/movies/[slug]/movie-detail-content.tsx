"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MovieDetailContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${params.slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  useEffect(() => {
    if (movie?.progress != null) {
      setProgress(movie.progress);
    }
  }, [movie?.progress]);

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId: movie.id }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["movie", params.slug] });
      const prev = queryClient.getQueryData(["movie", params.slug]);
      queryClient.setQueryData(["movie", params.slug], (old: any) =>
        old ? { ...old, isFavorited: !old.isFavorited } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["movie", params.slug], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["movie", params.slug] });
    },
  });

  const saveProgress = useMutation({
    mutationFn: async (pct: number) => {
      await fetch(`/api/movies/${params.slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: Math.round(pct) }),
      });
    },
  });

  useEffect(() => {
    if (!hasInteracted || !movie) return;
    const id = setInterval(() => {
      saveProgress.mutate(progress);
    }, 30000);
    return () => clearInterval(id);
  }, [hasInteracted, movie, progress, saveProgress]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!movie) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setProgress(pct);
      setHasInteracted(true);
      saveProgress.mutate(pct);
    },
    [movie, saveProgress]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Movie not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="self-start"
      >
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        <img
          src={movie.thumbnailUrl}
          alt={movie.title}
          className="size-full object-cover"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            {movie.genre && (
              <p className="text-muted-foreground">{movie.genre}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavorite.mutate()}
          >
            <Heart
              className={`size-5 ${
                movie.isFavorited
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          {movie.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>{Math.round(movie.duration / 60)} min</span>
          </div>

          <div
            className="relative h-2 w-full cursor-pointer rounded-full bg-muted overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
