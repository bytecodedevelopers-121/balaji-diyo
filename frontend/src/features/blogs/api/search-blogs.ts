import { isApiEnvelope } from "@/lib/api/api-response";
import type { Paginated } from "@/types/api.types";
import type { BlogPost } from "../types/blog.types";

/** Just the fields the search dropdown shows. */
export type BlogSearchResult = Pick<BlogPost, "id" | "title" | "slug" | "imageUrl" | "blogDate">;

/**
 * Header search's client-side blog lookup — `GET /blogs?search=…` straight
 * from the browser via `NEXT_PUBLIC_API_URL` (same direct-fetch pattern as
 * `searchTrips`; the server-only `apiFetch` can't be imported here). The
 * backend matches the blog title, case-insensitively.
 */
export async function searchBlogs(query: string, options?: { signal?: AbortSignal }): Promise<BlogSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${process.env.NEXT_PUBLIC_API_URL}/blogs?search=${encodeURIComponent(trimmed)}&perPage=4`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: options?.signal,
  });
  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok || (isApiEnvelope(body) && body.status === "error")) {
    throw new Error(
      (isApiEnvelope(body) ? body.message : undefined) || "Something went wrong. Please try again.",
    );
  }

  const page = (isApiEnvelope(body) ? body.data : body) as Paginated<BlogSearchResult> | null;
  return page?.items ?? [];
}
