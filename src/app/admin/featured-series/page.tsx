"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Film, ArrowUp, ArrowDown, Trash2, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FeaturedSeries = {
  id: number;
  seriesId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

type SeriesResult = {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

export default function FeaturedSeriesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: featured = [], isLoading } = useQuery<FeaturedSeries[]>({
    queryKey: ["admin-featured-series"],
    queryFn: async () => {
      const res = await fetch("/api/admin/featured-series");
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      return data.featured || [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: searchResults = [], isFetching: searching } = useQuery<SeriesResult[]>({
    queryKey: ["admin-series-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/admin/series?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.series || [];
    },
    enabled: !!searchQuery,
    staleTime: 30 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (seriesId: number) => {
      const res = await fetch("/api/admin/featured-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId }),
      });
      if (!res.ok) throw new Error();
    },
    onMutate: async (seriesId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const searchData = queryClient.getQueryData<SeriesResult[]>(["admin-series-search", searchQuery]) || [];
      const matching = searchData.find((s) => s.id === seriesId);
      if (!matching) return { previous };
      const optimistic: FeaturedSeries = {
        id: -Date.now(), seriesId, displayOrder: previous.length,
        title: matching.title, slug: matching.slug, thumbnailUrl: matching.thumbnailUrl,
      };
      queryClient.setQueryData(["admin-featured-series"], [...previous, optimistic]);
      return { previous };
    },
    onError: (_err, _seriesId, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSuccess: () => { setAddOpen(false); setSearchQuery(""); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/featured-series/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      queryClient.setQueryData(["admin-featured-series"], previous.filter((f) => f.id !== id));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const swapMutation = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
      const current = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/featured-series/${current[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[swapIdx].displayOrder }),
        }),
        fetch(`/api/admin/featured-series/${current[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: current[index].displayOrder }),
        }),
      ]);
      if (!res1.ok || !res2.ok) throw new Error();
    },
    onMutate: async ({ index, direction }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-featured-series"] });
      const previous = queryClient.getQueryData<FeaturedSeries[]>(["admin-featured-series"]) || [];
      if ((direction === "up" && index === 0) || (direction === "down" && index === previous.length - 1)) return { previous };
      const items = [...previous];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      [items[index], items[swapIdx]] = [items[swapIdx], items[index]];
      queryClient.setQueryData(["admin-featured-series"], items);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["admin-featured-series"], context.previous);
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["admin-featured-series"] }); },
  });

  const handleAdd = useCallback((seriesId: number) => addMutation.mutate(seriesId), [addMutation]);
  const handleRemove = useCallback((id: number) => removeMutation.mutate(id), [removeMutation]);
  const handleSwap = useCallback((index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === featured.length - 1)) return;
    swapMutation.mutate({ index, direction });
  }, [swapMutation, featured.length]);

  const alreadyFeaturedIds = useMemo(() => new Set(featured.map((f) => f.seriesId)), [featured]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Series</h1>
          <p className="text-muted-foreground mt-1">Manage which series appear on the series home page.</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button><Plus className="size-4 mr-2" />Add Series</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Featured Series</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search series..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => !alreadyFeaturedIds.has(s.id) && handleAdd(s.id)}
                      disabled={alreadyFeaturedIds.has(s.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                    >
                      {s.thumbnailUrl ? (
                        <Image src={s.thumbnailUrl} alt={s.title} width={40} height={40} className="size-10 rounded object-cover" />
                      ) : (
                        <div className="size-10 rounded bg-muted flex items-center justify-center"><Film className="size-4 text-muted-foreground" /></div>
                      )}
                      <span className="font-medium truncate flex-1">{s.title}</span>
                      {alreadyFeaturedIds.has(s.id) && <span className="text-xs text-muted-foreground">Already featured</span>}
                    </button>
                  ))
                ) : searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No series found.</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Type to search series.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0 max-h-150">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="size-10 rounded-md shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                  <div className="flex gap-1 shrink-0">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Star className="size-10 mx-auto mb-3 opacity-30" />
              <p>No featured series yet.</p>
              <p className="text-sm mt-1">Click &ldquo;Add Series&rdquo; to feature series on the home page.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium w-[50%]">Series</th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {featured.map((item, index) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl ? (
                            <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={item.thumbnailUrl} alt={item.title} width={40} height={40} className="size-full object-cover" />
                            </div>
                          ) : (
                            <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Film className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground">#{item.displayOrder + 1}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => handleSwap(index, "up")} disabled={index === 0}>
                            <ArrowUp className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleSwap(index, "down")} disabled={index === featured.length - 1}>
                            <ArrowDown className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleRemove(item.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
