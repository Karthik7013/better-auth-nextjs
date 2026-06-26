"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { PlayIcon, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";
import { notFound } from "next/navigation";

interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

interface Season {
  id: number;
  seasonNumber: number;
  title: string | null;
  episodes: Episode[];
}

interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
  seasons: Season[];
}

export function SeriesDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  const { data: series, isLoading, isError } = useQuery<SeriesDetail>({
    queryKey: ["series", slug],
    queryFn: async () => {
      const res = await fetch(`/api/series/${slug}`);
      if (res.status === 404) {
        notFound();
        return null as unknown as SeriesDetail;
      }
      if (!res.ok) throw new Error("Failed to fetch series");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[50vh] w-full" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (isError || !series) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Failed to load series.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[50vh] md:h-[60vh]">
        <Image
          src={series.backdropUrl || series.thumbnailUrl}
          alt={series.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            {series.releaseDate && (
              <span>{new Date(series.releaseDate).getFullYear()}</span>
            )}
            <span>{series.seasons.length} {series.seasons.length === 1 ? "season" : "seasons"}</span>
            <div className="flex gap-1.5">
              {series.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="border-border/50 text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
            {series.title}
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground line-clamp-2 md:line-clamp-3 max-w-2xl">
            {series.description}
          </p>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {series.seasons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No seasons available yet.</p>
        ) : (
          <div className="space-y-3">
            {series.seasons.map((season) => (
              <div key={season.id} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {expandedSeason === season.id ? (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-5 text-muted-foreground" />
                    )}
                    <span className="font-semibold">Season {season.seasonNumber}</span>
                    {season.title && (
                      <span className="text-muted-foreground">— {season.title}</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {season.episodes.length} {season.episodes.length === 1 ? "episode" : "episodes"}
                  </span>
                </button>

                {expandedSeason === season.id && (
                  <div className="border-t border-border/50 divide-y divide-border/50">
                    {season.episodes.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">No episodes yet.</p>
                    ) : (
                      season.episodes.map((ep) => (
                        <div key={ep.id} className="flex items-center gap-4 p-3 hover:bg-muted/20 transition-colors">
                          <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-muted shrink-0">
                            {ep.thumbnailUrl && (
                              <Image
                                src={ep.thumbnailUrl}
                                alt={ep.title}
                                fill
                                className="object-cover"
                                sizes="112px"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                {ep.episodeNumber}.
                              </span>
                              <p className="text-sm font-semibold truncate">{ep.title}</p>
                            </div>
                            {ep.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {ep.description}
                              </p>
                            )}
                            {ep.durationSeconds && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDuration(ep.durationSeconds)}
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/watch/series/${series.slug}?season=${season.seasonNumber}&episode=${ep.episodeNumber}`}
                            className={`inline-flex items-center gap-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors h-8 px-3 ${
                              ep.videoUrl
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border border-input bg-transparent text-muted-foreground pointer-events-none opacity-50"
                            }`}
                          >
                            {ep.videoUrl ? <PlayIcon className="size-3.5" /> : null}
                            {ep.videoUrl ? "Play" : "Unavailable"}
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
