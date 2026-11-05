import { apiFetch } from "@/lib/api/api-client";
import { SHOW_SAMPLE_DATA } from "@/lib/sample-data";
import type { Paginated } from "@/types/api.types";
import { querySampleBlogs, SAMPLE_BLOG_CATEGORIES } from "../lib/sample-blogs";
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
 *
 * With an empty or unreachable API this falls back to the built-in sample
 * posts, like the rest of the site (see `SHOW_SAMPLE_DATA`).
 */
export async function getBlogs({ page = 1, perPage = 9, search, categoryId }: GetBlogsParams = {}): Promise<Paginated<BlogPost>> {
  const query = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) query.set("search", search);
  if (categoryId) query.set("categoryId", categoryId);

  const sample = () => querySampleBlogs({ page, perPage, search, categoryId });
  // A sample category id can never exist in the API, so it always uses the samples.
  if (SHOW_SAMPLE_DATA && categoryId?.startsWith("sample-")) return sample();

  try {
    const result = await apiFetch<Paginated<BlogPost>>(`/blogs?${query.toString()}`, {
      next: { revalidate: 900, tags: ["blogs"] },
    });
    if (result.meta.total === 0 && !search && !categoryId && SHOW_SAMPLE_DATA) return sample();
    return result;
  } catch (error) {
    if (!SHOW_SAMPLE_DATA) throw error;
    return sample();
  }
}

/** Categories for the blog filter dropdown. */
export async function getBlogCategories(): Promise<BlogCategoryOption[]> {
  if (SHOW_SAMPLE_DATA) {
    // Mirror getBlogs: when there are no real posts, the dropdown lists the sample categories.
    const real = await getBlogs({ perPage: 1 });
    if (real.items.some((post) => post.id.startsWith("sample-"))) return SAMPLE_BLOG_CATEGORIES;
  }
  const page = await apiFetch<Paginated<BlogCategoryOption>>("/categories?isActive=true&perPage=100", {
    next: { revalidate: 900, tags: ["categories"] },
  });
  return page.items.map(({ id, title }) => ({ id, title }));
}
