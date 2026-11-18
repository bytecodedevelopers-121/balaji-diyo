import { apiFetch } from "@/lib/api/api-client";
import type { Paginated } from "@/types/api.types";
import type { BlogCategoryOption, BlogPost } from "../types/blog.types";

export interface GetBlogsParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: string;
}

/**
 * Public blog listing from `GET /blogs` (active, non-trashed only, newest
 * first). Tagged `"blogs"` — the backend's blog service revalidates that tag
 * (and `/blog`) after any create/update/delete.
 */
export async function getBlogs({ page = 1, perPage = 9, search, categoryId }: GetBlogsParams = {}): Promise<Paginated<BlogPost>> {
  const query = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) query.set("search", search);
  if (categoryId) query.set("categoryId", categoryId);

  return apiFetch<Paginated<BlogPost>>(`/blogs?${query.toString()}`, {
    next: { revalidate: 900, tags: ["blogs"] },
  });
}

/** Categories for the blog filter dropdown. */
export async function getBlogCategories(): Promise<BlogCategoryOption[]> {
  const page = await apiFetch<Paginated<BlogCategoryOption>>("/categories?isActive=true&perPage=100", {
    next: { revalidate: 900, tags: ["categories"] },
  });
  return page.items.map(({ id, title }) => ({ id, title }));
}
