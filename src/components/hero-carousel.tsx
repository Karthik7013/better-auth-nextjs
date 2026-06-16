"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

interface HeroCarouselProps {
  items: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
  }[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(0);
  const length = items.length;

  const goTo = useCallback((i: number) => {
    setPrev(current);
    setCurrent(i);
  }, [current]);

  const next = useCallback(() => {
    goTo((current + 1) % length);
  }, [current, length, goTo]);

  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [length, next]);

  if (length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Link href={`/movies/${item.slug}`}>
            <div className="relative aspect-video md:aspect-[21/9]">
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl max-w-2xl leading-tight">
                  {item.title}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95">
                    <Play className="size-4 fill-black" />
                    Play
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
      <div className="relative z-20 aspect-video md:aspect-[21/9]" />
      {length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
