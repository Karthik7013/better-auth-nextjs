"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface UseAdminCrudOptions {
  baseKey: string;
  endpoint: string;
  defaultLimit?: number;
}

export function useAdminCrud<T>({ baseKey, endpoint, defaultLimit = 20 }: UseAdminCrudOptions) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const limit = defaultLimit;

  const queryKey = [baseKey, page, debouncedSearch];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<{ total: number; totalPages: number } & Record<string, T[]>>;
    },
  });

  const items: T[] = (data ? Object.values(data).find((v) => Array.isArray(v)) : []) as T[];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      toast.success("Deleted successfully");
      queryClient.invalidateQueries({ queryKey: [baseKey] });
    },
    onError: () => toast.error("Failed to delete"),
  });

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: [baseKey] });
  }

  return {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    limit,
    items,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    deleteMutation,
    invalidateList,
  };
}
