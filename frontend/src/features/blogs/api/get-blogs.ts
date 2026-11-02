import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { BlogPost } from "../types/blog.types";

export interface GetBlogsParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
}

/**
 * Fetches one page of the public blog listing from `GET /blogs` (always
 * isActive-only server-side — see blog.routes.ts's own comment, there's
 * no separate public/admin split to opt into here the way team-member's
 * `isActive` query param works).
 *
 * `search` filters by title only (blog.service.ts's own `list()`), and
 * `categoryId` matches design-references/blog.png's category pill row —
 * see get-blog-categories.ts for where the real category ids come from.
 */
export async function getBlogs({
  page = 1,
  perPage = 9,
  search,
  categoryId,
}: GetBlogsParams = {}): Promise<Paginated<BlogPost>> {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);

  return apiFetch<Paginated<BlogPost>>(`/blogs?${params.toString()}`, {
    next: { revalidate: 900, tags: ["blogs"] },
  });
}
