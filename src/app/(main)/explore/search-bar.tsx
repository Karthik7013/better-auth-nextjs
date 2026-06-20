"use client";

import { Input } from "@/components/ui/input";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      placeholder="Search movies..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
