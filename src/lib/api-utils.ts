const BASE_IGNORED = ["page", "limit", "search", "sortBy", "sortDir"];

export function extractColumnFilters(searchParams: URLSearchParams, extraIgnore: string[] = []): Record<string, string> {
  const ignored = new Set([...BASE_IGNORED, ...extraIgnore]);
  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!ignored.has(key) && value) {
      filters[key] = value;
    }
  }
  return filters;
}

export function parsePagination(searchParams: URLSearchParams, defaults = { page: "1", limit: "20" }) {
  return {
    page: parseInt(searchParams.get("page") || defaults.page),
    limit: parseInt(searchParams.get("limit") || defaults.limit),
    search: searchParams.get("search") || undefined,
    sortBy: searchParams.get("sortBy") || undefined,
    sortDir: (searchParams.get("sortDir") as "asc" | "desc") || undefined,
  };
}

export function parseAdminListParams(searchParams: URLSearchParams, defaults = { page: "1", limit: "20" }, extraIgnore: string[] = []) {
  const pagination = parsePagination(searchParams, defaults);
  return { ...pagination, columnFilters: extractColumnFilters(searchParams, extraIgnore) };
}
