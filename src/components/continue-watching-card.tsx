import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";

interface ContinueWatchingCardProps {
  title: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  href: string;
}

export const ContinueWatchingCard = memo(function ContinueWatchingCard({
  title,
  thumbnailUrl,
  progressPercent,
  href,
}: ContinueWatchingCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-muted">
        <ShimmerImage
          src={thumbnailUrl ?? ""}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
          priority={false}
          fetchPriority="auto"
          loading="lazy"
          imgClassName="object-cover transition-transform group-hover:scale-105"
          wrapperClassName="absolute inset-0"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div
            className="h-full bg-white"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>
      <p className="mt-1.5 text-sm font-medium truncate">{title}</p>
    </Link>
  );
});
