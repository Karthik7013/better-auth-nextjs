"use client";

import { Search } from "lucide-react";

export default function SearchBar({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/50 px-3.5 text-sm text-muted-foreground/60 transition-all hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 focus-visible:bg-background outline-none"
    >
      <Search className="size-4" />
      <span>Search movies...</span>
    </button>
  );
}
