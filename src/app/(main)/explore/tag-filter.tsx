"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface Tag {
  id: number;
  name: string;
}

export default function TagFilter({
  tags,
  selectedTags,
  onToggle,
  isLoading,
}: {
  tags: Tag[];
  selectedTags: number[];
  onToggle: (tagId: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="w-18 h-9 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onToggle(tag.id)}
          className={`rounded-full px-3 py-1 text-sm border transition-colors ${
            selectedTags.includes(tag.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-muted"
          }`}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
